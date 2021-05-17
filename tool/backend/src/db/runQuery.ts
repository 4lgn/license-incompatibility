import Transaction from 'neo4j-driver/types/transaction'
import { Project } from '../parsers/Parser'

export const findIncompatibilitiesForProject = async (
  project: Project,
  tx: Transaction,
  minDepth: number,
  maxDepth: number
): Promise<string[]> => {
  const projectName = project.name
  const platform = project.platform

  const mergeVersionsQuery = `
  MATCH p = (l1:License)<-[:HAS_LICENSE]-(p1:Project {name: "${projectName}", platform: "${platform}"})-[:PROJECT_DEPENDS_ON*${minDepth}..${maxDepth}]->(p2:Project {platform: "${platform}"})-[:HAS_LICENSE]->(l2:License)
  USING INDEX p1:Project(name)
  WHERE (l1)-[:IS_INCOMPATIBLE_WITH]->(l2)
  WITH nodes(p) AS nodes
  UNWIND nodes AS node
  MATCH (node:Project)
  WITH node
  MATCH (node)-[:HAS_VERSION]->(v1:Version)-[:VERSION_DEPENDS_ON]->(:Project)
  WITH node, collect(v1) AS versions
  CALL mergeVersions(versions, node)
  RETURN 1;
  `

  const dependencyRequirementsQuery = `
  MATCH (:Project)-[:HAS_VERSION]->(v1:MetaVersion)-[dep:VERSION_DEPENDS_ON]->(:Project)-[:HAS_VERSION]->(v2:MetaVersion)
  WHERE bachelor.compareVersion(dep.dependencyRequirement, v2.number)
  MERGE (v1)-[r:VERSION_DEPENDS_ON_REQ]->(v2)
  RETURN COUNT(r);
  `

  const findIncompQuery = `
  MATCH (l1:License)<-[:HAS_LICENSE]-(p1:Project {name: "${projectName}", platform: "${platform}"})-[:PROJECT_DEPENDS_ON*${minDepth}..${maxDepth}]->(p2:Project)-[:HAS_LICENSE]->(l2:License)
  USING INDEX p1:Project(name)
  WHERE (l1)-[:IS_INCOMPATIBLE_WITH]->(l2)
  WITH DISTINCT p1 AS start, p2 AS end
  MATCH (start)-[:HAS_VERSION]->(:MetaVersion)-[:VERSION_DEPENDS_ON_REQ*${minDepth}..${maxDepth}]->(:MetaVersion)-[:VERSION_DEPENDS_ON]->(end)
  RETURN DISTINCT end.name AS name;
  `

  // const cleanupQuery = `
  // MATCH (q)-[w]->(m:MetaVersion)-[e]->(r)
  // DELETE w, e, m;
  // `

  console.log('Merging versions...')
  const result1 = await tx.run(mergeVersionsQuery)
  console.log('Creating VERSION_DEPENDS_ON_REQ relationships...')
  const result2 = await tx.run(dependencyRequirementsQuery)
  console.log('Running final query...')
  const result3 = await tx.run(findIncompQuery)
  // const cleanup = await tx.run(cleanupQuery)

  return result3.records.map(rec => rec.get('name'))
}
