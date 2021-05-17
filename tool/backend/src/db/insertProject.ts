import { Project } from '../parsers/Parser'
import Transaction from 'neo4j-driver/types/transaction'
import Driver from 'neo4j-driver/types/driver'
import { findIncompatibilitiesForProject } from './runQuery'
import {
  insertIncompatabilities,
  licenseIncompatability,
} from './insertIncompatabilities'

const createProjectWithDependencies = async (
  tx: Transaction,
  project: Project
) => {
  // Create project, version and license
  // TODO: If no license can be found in db with the given name return an error
  const createProject = `
  MATCH (l:License {name: $licenseName})
  CREATE path = (v: Version { number: $versionNumber })<-[:HAS_VERSION]-(p: Project { name: $projectName, platform: $platform })-[:HAS_LICENSE]->(l)
  `

  await tx.run(createProject, {
    projectName: project.name,
    platform: project.platform,
    licenseName: project.license,
    versionNumber: project.version,
  })

  // Create relationships between version and dependencies
  const createDependency = `
    MATCH (p: Project { name: $projectName, platform: $platform })-[:HAS_VERSION]->(v: Version)
    MATCH (d: Project { name: $dependencyName, platform: $platform })
    CREATE (v)-[:VERSION_DEPENDS_ON { dependencyRequirement: $dependencyRequirement }]->(d)
    CREATE (p)-[:PROJECT_DEPENDS_ON]->(d)
    `
  // Remember to replace testDependencies with package.dependencies
  const inserts = Object.entries(project.dependencies).map(
    async ([key, value]) => {
      const insert = async () => {
        await tx.run(createDependency, {
          projectName: project.name,
          platform: project.platform,
          dependencyName: key,
          dependencyRequirement: value,
        })
      }
      insert()
    }
  )

  await Promise.all(inserts)
}

export const insertAndFindIncompatibilities = async (
  driver: Driver,
  database: string,
  project: Project,
  licenseIncompatabilities: {
    [incompatabilityId: number]: licenseIncompatability
  },
  socketInstance: any
): Promise<string[]> => {
  const session = driver.session({
    database: database,
  })

  try {
    return await session.writeTransaction(async tx => {
      socketInstance.emit('progress', 'Creating license incompatibilities')

      console.log('Creating license incompatabilities...')
      await insertIncompatabilities(tx, licenseIncompatabilities)
      const queryLicenses =
        'MATCH (l1: License)-[i: IS_INCOMPATIBLE_WITH]->(l2: License) RETURN l1, l2'
      const res = await tx.run(queryLicenses)
      res.records.map(r => {
        const incompatibiltyCase =
          r.get(0).properties.name +
          ' is incompatible with ' +
          r.get(1).properties.name
        console.log(incompatibiltyCase)
        socketInstance.emit('progress', incompatibiltyCase)
      })

      console.log('Creating project...')
      socketInstance.emit('progress', 'Creating project...')

      await createProjectWithDependencies(tx, project)
      console.log('Finding incompatibilities...')
      socketInstance.emit('progress', 'Finding incompatabilities...')
      const incomps = await findIncompatibilitiesForProject(project, tx, 1, 3)

      socketInstance.emit('progress', 'Cleaning up...')
      // Rollback all changes
      await tx.rollback()
      await session.close()

      return incomps
    })
  } catch (e) {
    throw new Error('Error in query')
  }
}
