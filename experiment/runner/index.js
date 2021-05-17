import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  "neo4j://localhost:7687",
  neo4j.auth.basic("neo4j", process.env.DB_PASS)
);

const session = driver.session({ database: 'neo4j', defaultAccessMode: "READ" });

const labelCandidateProjects = async () => await session.writeTransaction(async txc => {
  console.log('Labelling candidate projects...');
  const candidateProjectsCount = (await txc.run(`
    MATCH p = (l1:License)<-[:HAS_LICENSE]-(p1:Project)-[:PROJECT_DEPENDS_ON*1..2]->(p2:Project)-[:HAS_LICENSE]->(l2:License)
    WHERE (l1)-[:IS_INCOMPATIBLE_WITH]->(l2)
    WITH nodes(p) AS nodes
    UNWIND nodes AS node
    MATCH (node:Project)
    SET node:CandidateProject
    RETURN COUNT(DISTINCT node) AS count;
  `)).records.map(rec => rec.get('count'))
  console.log('Labelled ' + candidateProjectsCount + ' projects...');
  await txc.commit()
})


const mergeVersions = async () => await session.writeTransaction(async txc => {
  console.log('Merging versions...');
  await txc.run(`
    CALL apoc.periodic.commit("
      MATCH (p1:CandidateProject)-[:HAS_VERSION]->(v1:Version)-[:VERSION_DEPENDS_ON]->(p2:CandidateProject)
      WHERE NOT EXISTS ((p1)-[:HAS_VERSION]->(:MetaVersion))
      WITH p1, collect(v1) AS versions LIMIT $limit
      CALL mergeVersions(versions, p1)
      RETURN COUNT(p1)
      ",
      {limit:500});
  `)
  await txc.commit()
})

const createVersionRequirements = async () => await session.writeTransaction(async txc => {
  console.log('Creating VERSION_DEPENDS_ON_REQ...');
  await txc.run(`
    CALL apoc.periodic.iterate("
      MATCH (:CandidateProject)-[:HAS_VERSION]->(v1:MetaVersion)-[dep:VERSION_DEPENDS_ON]->(:CandidateProject)-[:HAS_VERSION]->(v2:MetaVersion)
      WHERE bachelor.compareVersion(dep.dependencyRequirement, v2.number)
      RETURN v1,v2
      ",
      "MERGE (v1)-[r:VERSION_DEPENDS_ON_REQ]->(v2)",
      {batchSize:100, parallel:false});
  `)
  await txc.commit()
})

const findIncompatibilities = async () => await session.writeTransaction(async txc => {
  console.log('Finding and labelling all license incompatibilities on depth 1..2...');
  const incompCount = (await txc.run(`
    MATCH (l1:License)<-[:HAS_LICENSE]-(p1:CandidateProject)-[:PROJECT_DEPENDS_ON*1..2]->(p2:CandidateProject)-[:HAS_LICENSE]->(l2:License)
    WHERE (l1)-[:IS_INCOMPATIBLE_WITH]->(l2)
    WITH DISTINCT p1 AS start, p2 AS end
    MATCH (start)-[:HAS_VERSION]->(start_v:MetaVersion)
    WHERE EXISTS ((start_v)-[:VERSION_DEPENDS_ON]->(end))
    OR EXISTS ((start_v)-[:VERSION_DEPENDS_ON_REQ]->(:MetaVersion)-[:VERSION_DEPENDS_ON]->(end))
    SET start:IncompatibleProject
    SET start_v:IncompatibleProjectVersion
    MERGE (start)-[:IS_INCOMPATIBLE_WITH]->(end)
    RETURN COUNT(DISTINCT start) AS count;
  `)).records.map(rec => rec.get('count'))
  console.log('Found ' + incompCount + ' incompatible projects...');
  await txc.commit()
})

const findTransitiveCandidateProjects = async () => await session.writeTransaction(async txc => {
  console.log('Finding transitive candidate projects...');
  const transitiveCandidateProjectCount = (await txc.run(`
    MATCH (p1:Project)-[:PROJECT_DEPENDS_ON]->(p2:IncompatibleProject)
    WHERE NOT p1:IncompatibleProject
    SET p1:TransitiveCandidateProject
    RETURN COUNT(DISTINCT p1) AS count;
  `)).records.map(rec => rec.get('count'))
  console.log('Found ' + transitiveCandidateProjectCount + ' transitive project candidates');
  await txc.commit()
})

const mergeVersionsTransitive = async () => await session.writeTransaction(async txc => {
  console.log('Merging versions of all transitive project candidates...');
  await txc.run(`
    CALL apoc.periodic.commit("
      MATCH (p1:TransitiveCandidateProject)-[:HAS_VERSION]->(v1:Version)
      WHERE NOT EXISTS ((p1)-[:HAS_VERSION]->(:MetaVersion))
      WITH p1, collect(v1) AS versions LIMIT $limit
      CALL mergeVersions(versions, p1)
      RETURN COUNT(p1)
      ",
      {limit:200});
  `)
  await txc.commit()
})


const createVersionRequirementsTransitive = async (depth) => await session.writeTransaction(async txc => {
  console.log('Creating transitive VERSIONS_DEPENDS_ON_REQ relationships...');

  await txc.run(`
      MATCH (p1:TransitiveCandidateProject)-[:HAS_VERSION]->(v1:MetaVersion)-[dep:VERSION_DEPENDS_ON]->(p2:IncompatibleProject)-[:HAS_VERSION]->(v2:IncompatibleProjectVersion)
      WHERE bachelor.compareVersion(dep.dependencyRequirement, v2.number)
      SET p1:TransitiveIncompatibleProject
      SET v1:TransitiveIncompatibleVersion
      SET p1.depth = ${depth}
      MERGE (v1)-[r:VERSION_DEPENDS_ON_REQ]->(v2)
      WITH p1, p2
      MATCH (p2)-[:IS_INCOMPATIBLE_WITH]->(p3:Project)
      MERGE (p1)-[:IS_INCOMPATIBLE_WITH]->(p3)
      MERGE (p1)-[:IS_INCOMPATIBLE_THROUGH]->(p2);
  `)
  await txc.commit()
})


const cleanupTransitiveCandidates = async () => await session.writeTransaction(async txc => {
  console.log('Cleaning up old candidate projects...');
  await txc.run(`
    MATCH (p1:TransitiveCandidateProject)
    SET p1:TransitiveExploredProject
    REMOVE p1:TransitiveCandidateProject;
  `)
  const transitiveIncompatibleProjectCount = (await txc.run(`
    MATCH (p1:TransitiveIncompatibleProject)
    RETURN COUNT(p1) AS count
  `)).records.map(rec => rec.get('count'))
  console.log('Found in total ' + transitiveIncompatibleProjectCount + ' transitive incompatibilities...');
  await txc.commit()
})

const findArbitraryTransitiveCandidateProjects = async () => await session.writeTransaction(async txc => {
  console.log('Finding arbitrary transitive candidate projects...');
  const transitiveCandidateProjectCount = (await txc.run(`
    MATCH (p1:Project)-[:PROJECT_DEPENDS_ON]->(p2:TransitiveIncompatibleProject)
    WHERE NOT p1:IncompatibleProject
    AND NOT p1:TransitiveExploredProject
    SET p1:TransitiveCandidateProject
    RETURN COUNT(DISTINCT p1) AS count;
  `)).records.map(rec => rec.get('count'))
  console.log('Found in total ' + transitiveCandidateProjectCount + ' transitive candidates...');
  await txc.commit()
  return parseInt(transitiveCandidateProjectCount)
})


const mergeVersionsTransitiveArbitrary = async () => await session.writeTransaction(async txc => {
  console.log('Merging versions of arbitrary depth transitive candidate projects...');
  await txc.run(`
    CALL apoc.periodic.commit("
      MATCH (p1:TransitiveCandidateProject)-[:HAS_VERSION]->(v1:Version)
      WHERE NOT EXISTS ((p1)-[:HAS_VERSION]->(:MetaVersion))
      WITH p1, collect(v1) AS versions LIMIT $limit
      CALL mergeVersions(versions, p1)
      RETURN COUNT(p1)
      ",
      {limit:200});
  `)
  await txc.commit()
})

const createVersionRequirementsTransitiveArbitrary = async (depth) => await session.writeTransaction(async txc => {
  console.log('Creating VERSION_DEPENDS_ON_REQ for transitive candidate projects to transitive incompatible projects (arbitrary depth)...');
  await txc.run(`
    MATCH (p1:TransitiveCandidateProject)-[:HAS_VERSION]->(v1:MetaVersion)-[dep:VERSION_DEPENDS_ON]->(p2:TransitiveIncompatibleProject)-[:HAS_VERSION]->(v2:TransitiveIncompatibleVersion)
    WHERE bachelor.compareVersion(dep.dependencyRequirement, v2.number)
    SET p1:TransitiveIncompatibleProject
    SET v1:TransitiveIncompatibleVersion
    SET p1.depth = ${depth}
    MERGE (v1)-[r:VERSION_DEPENDS_ON_REQ]->(v2)
    WITH p1, p2
    MATCH (p2)-[:IS_INCOMPATIBLE_WITH]->(p3:Project)
    MERGE (p1)-[:IS_INCOMPATIBLE_WITH]->(p3)
    MERGE (p1)-[:IS_INCOMPATIBLE_THROUGH]->(p2);
  `)
  await txc.commit()
})

const cleanupArbitraryTransitiveCandidates = async () => await session.writeTransaction(async txc => {
  console.log('Cleaning up old arbitrary transitive candidate projects...');
  await txc.run(`
    MATCH (p1:TransitiveCandidateProject)
    SET p1:TransitiveExploredProject
    REMOVE p1:TransitiveCandidateProject;
  `)
  await txc.commit()
})

const labelIncompatibleProjectsDepth = async () => await session.writeTransaction(async txc => {
  console.log('Labelling incompatible project\'s depth');
  await txc.run(`
    MATCH (start:IncompatibleProject)-[:IS_INCOMPATIBLE_WITH]->(end:Project)
    WITH DISTINCT start AS s, end AS e
    MATCH p = (l1:License)<-[:HAS_LICENSE]-(s)-[:PROJECT_DEPENDS_ON*1..2]->(e)-[:HAS_LICENSE]->(l2:License)
    WITH DISTINCT s, p, [r IN relationships(p) WHERE type(r) = 'PROJECT_DEPENDS_ON' | r] AS rels
    UNWIND rels AS project_depends_on_rels
    WITH DISTINCT s, p, COUNT(project_depends_on_rels) AS depth_count
    WITH s, min(depth_count) AS depth_count
    SET s.depth = depth_count;
  `)
  await txc.commit()
})

const runExperiment = async () => await session.writeTransaction(async txc => {

  const projectNodes = (await txc.run(`
    MATCH (p:Project) RETURN COUNT(p) AS count;
  `)).records.map(rec => rec.get('count'))

  const incompatibleProjectsCount = (await txc.run(`
    MATCH (p:IncompatibleProject) RETURN COUNT(p) AS count;
  `)).records.map(rec => parseInt(rec.get('count')))[0]
  const transitiveIncompatibleProjectsCount = (await txc.run(`
    MATCH (p:TransitiveIncompatibleProject) RETURN COUNT(p) AS count;
  `)).records.map(rec => parseInt(rec.get('count')))[0]

  const incompatibleProjects = (await txc.run(`
    MATCH (l1:License)<-[:HAS_LICENSE]-(p1:IncompatibleProject)-[:HAS_VERSION]->(v1:IncompatibleProjectVersion)
    MATCH (p1)-[:IS_INCOMPATIBLE_WITH]->(p2:Project)-[:HAS_LICENSE]->(l2:License)
    RETURN DISTINCT p1.name AS projectName, l1.name AS projectLicense, p1.depth AS depth, p2.name AS incompatibleDependency, l2.name AS dependencyLicense,  toInteger(p1.dependentRepositoriesCount) AS dependentRepositoriesCount
    ORDER BY dependentRepositoriesCount DESC;
  `)).records.map(rec => ({ projectName: rec.get('projectName'), projectLicense: rec.get('projectLicense'), depth: rec.get('depth'), incompatibleDependency: rec.get('incompatibleDependency'), dependencyLicense: rec.get('dependencyLicense'), dependentRepositoriesCount: rec.get('dependentRepositoriesCount') }))

  const transitiveIncompatibleProjects = (await txc.run(`
    MATCH (l1:License)<-[:HAS_LICENSE]-(p1:TransitiveIncompatibleProject)-[:HAS_VERSION]->(v1:TransitiveIncompatibleVersion)
    MATCH (p1)-[:IS_INCOMPATIBLE_WITH]->(p2:Project)-[:HAS_LICENSE]->(l2:License)
    RETURN DISTINCT p1.name AS projectName, l1.name AS projectLicense, p1.depth AS depth, p2.name AS incompatibleDependency, l2.name AS dependencyLicense,  toInteger(p1.dependentRepositoriesCount) AS dependentRepositoriesCount
    ORDER BY dependentRepositoriesCount DESC;
  `)).records.map(rec => ({ projectName: rec.get('projectName'), projectLicense: rec.get('projectLicense'), depth: rec.get('depth'), incompatibleDependency: rec.get('incompatibleDependency'), dependencyLicense: rec.get('dependencyLicense'), dependentRepositoriesCount: rec.get('dependentRepositoriesCount') }))

  const totalIncompatibleProjects = incompatibleProjectsCount + transitiveIncompatibleProjectsCount
  const incompatibilityRatio = ((totalIncompatibleProjects / projectNodes) * 100).toFixed(2)

  console.log('Project nodes: ' + projectNodes);
  console.log('Incompatible projects: ' + incompatibleProjectsCount);
  console.log('Transitive incompatible projects: ' + transitiveIncompatibleProjectsCount);
  console.log('Total incompatible projects: ' + totalIncompatibleProjects);
  console.log('Incompatibility ratio: ' + incompatibilityRatio + '%');

  const versionCount = (await txc.run(`
    MATCH (p1:Project)-[:HAS_VERSION]->(v:Version)
    WITH p1, COUNT(v) as count
    RETURN avg(count) AS avg, min(count) AS min, max(count) AS max, apoc.agg.median(count) AS median, stDev(count) AS std;
  `)).records.map(rec => ({ avg: rec.get('avg'), min: rec.get('min'), max: rec.get('max'), median: rec.get('median'), std: rec.get('std') }))[0]

  const dependenciesCount = (await txc.run(`
    MATCH (p1:Project)-[:PROJECT_DEPENDS_ON]->(p2:Project)
    WITH p1, COUNT(p2) as count
    RETURN avg(count) AS avg, min(count) AS min, max(count) AS max, apoc.agg.median(count) AS median, stDev(count) AS std;
  `)).records.map(rec => ({ avg: rec.get('avg'), min: rec.get('min'), max: rec.get('max'), median: rec.get('median'), std: rec.get('std') }))[0]

  const incompatibleVersionCount = (await txc.run(`
    MATCH (p1:Project)-[:HAS_VERSION]->(v:Version)
    WHERE p1:IncompatibleProject
    OR p1:TransitiveIncompatibleProject
    WITH p1, COUNT(v) as count
    RETURN avg(count) AS avg, min(count) AS min, max(count) AS max, apoc.agg.median(count) AS median, stDev(count) AS std;
  `)).records.map(rec => ({ avg: rec.get('avg'), min: rec.get('min'), max: rec.get('max'), median: rec.get('median'), std: rec.get('std') }))[0]

  const incompatibleDependenciesCount = (await txc.run(`
    MATCH (p1:Project)-[:PROJECT_DEPENDS_ON]->(p2:Project)
    WHERE p1:IncompatibleProject
    OR p1:TransitiveIncompatibleProject
    WITH p1, COUNT(p2) as count
    RETURN avg(count) AS avg, min(count) AS min, max(count) AS max, apoc.agg.median(count) AS median, stDev(count) AS std;
  `)).records.map(rec => ({ avg: rec.get('avg'), min: rec.get('min'), max: rec.get('max'), median: rec.get('median'), std: rec.get('std') }))[0]

  const incompatibleProjectDepth = (await txc.run(`
    MATCH (p1:Project)
    WHERE p1:IncompatibleProject
    OR p1:TransitiveIncompatibleProject
    RETURN avg(p1.depth) AS avg, min(p1.depth) AS min, max(p1.depth) AS max, apoc.agg.median(p1.depth) AS median, stDev(p1.depth) AS std;
  `)).records.map(rec => ({ avg: rec.get('avg'), min: rec.get('min'), max: rec.get('max'), median: rec.get('median'), std: rec.get('std') }))[0]

  console.log('Project versions:')
  console.log('    average: ' + versionCount.avg.toFixed(2))
  console.log('    min: ' + versionCount.min)
  console.log('    max: ' + versionCount.max)
  console.log('    median: ' + versionCount.median)
  console.log('    std: ' + versionCount.std.toFixed(2))

  console.log('Project dependencies:')
  console.log('    average: ' + dependenciesCount.avg.toFixed(2))
  console.log('    min: ' + dependenciesCount.min)
  console.log('    max: ' + dependenciesCount.max)
  console.log('    median: ' + dependenciesCount.median)
  console.log('    std: ' + dependenciesCount.std.toFixed(2))

  console.log('Incompatible project versions:')
  console.log('    average: ' + incompatibleVersionCount.avg.toFixed(2))
  console.log('    min: ' + incompatibleVersionCount.min)
  console.log('    max: ' + incompatibleVersionCount.max)
  console.log('    median: ' + incompatibleVersionCount.median)
  console.log('    std: ' + incompatibleVersionCount.std.toFixed(2))

  console.log('Incompatible project dependencies:')
  console.log('    average: ' + incompatibleDependenciesCount.avg.toFixed(2))
  console.log('    min: ' + incompatibleDependenciesCount.min)
  console.log('    max: ' + incompatibleDependenciesCount.max)
  console.log('    median: ' + incompatibleDependenciesCount.median)
  console.log('    std: ' + incompatibleDependenciesCount.std.toFixed(2))

  console.log('Incompatible projects depth:')
  console.log('    average: ' + incompatibleProjectDepth.avg.toFixed(2))
  console.log('    min: ' + incompatibleProjectDepth.min)
  console.log('    max: ' + incompatibleProjectDepth.max)
  console.log('    median: ' + incompatibleProjectDepth.median)
  console.log('    std: ' + incompatibleProjectDepth.std.toFixed(2))

  const projectsCausingIncompatibilities = (await txc.run(`
    MATCH (p1:Project)-[:IS_INCOMPATIBLE_WITH]->(p2:Project)
    WHERE p1:IncompatibleProject
    OR p1:TransitiveIncompatibleProject
    RETURN DISTINCT p2.name AS projectName, COUNT(p1) AS incompatibleProjectsCaused
    ORDER BY incompatibleProjectsCaused DESC;
  `)).records.map(rec => [rec.get('projectName'), rec.get('incompatibleProjectsCaused')])

  const mostUsedLicenses = (await txc.run(`
    MATCH (p:Project)-[:HAS_LICENSE]->(l:License)
    RETURN DISTINCT l.name AS licenseName, COUNT(l) AS licenseCount
    ORDER BY licenseCount DESC;
  `)).records.map(rec => [rec.get('licenseName'), rec.get('licenseCount')])

  const mostUsedLicensesForProjectsCausingIncompatibilities = (await txc.run(`
    MATCH (start:Project)-[:IS_INCOMPATIBLE_WITH]->(end:Project)-[:HAS_LICENSE]->(l:License)
    WHERE start:IncompatibleProject
    OR start:TransitiveIncompatibleProject
    RETURN l.name AS licenseName, COUNT(DISTINCT end) AS projectsCount
    ORDER BY projectsCount DESC;
  `)).records.map(rec => [rec.get('licenseName'), rec.get('projectsCount')])

  const mostUsedLicensesForIncompatibleProjects = (await txc.run(`
    MATCH (start:Project)-[:HAS_LICENSE]->(l:License)
    WHERE start:IncompatibleProject
    OR start:TransitiveIncompatibleProject
    RETURN l.name AS licenseName, COUNT(DISTINCT start) AS projectsCount
    ORDER BY projectsCount DESC;
  `)).records.map(rec => [rec.get('licenseName'), rec.get('projectsCount')])

  console.log('Licenses most often used on the platform:')
  mostUsedLicenses.map(([licenseName, licenseCount]) => {
    console.log(`    - ${licenseName}: ${licenseCount} (${((licenseCount / projectNodes) * 100).toFixed(2)}%)`);
  })

  console.log('Most used licenses for projects which caused incompatibilities')
  mostUsedLicensesForProjectsCausingIncompatibilities.map(([licenseName, projectsCount]) => {
    console.log(`    - ${licenseName}: ${projectsCount} (${((projectsCount / projectsCausingIncompatibilities.length) * 100).toFixed(2)}%)`);
  })

  console.log('Most used licenses for incompatible projects')
  mostUsedLicensesForIncompatibleProjects.map(([licenseName, projectsCount]) => {
    console.log(`    - ${licenseName}: ${projectsCount} (${((projectsCount / totalIncompatibleProjects) * 100).toFixed(2)}%)`);
  })

  console.log('All found incompatibilities are caused by the following ' + projectsCausingIncompatibilities.length + ' projects (showing the amount of projects each have caused to be incompatible):');
  projectsCausingIncompatibilities.forEach(([projectName, incompatibleProjectsCaused]) => {
    console.log(`    -  ${projectName}:  ${incompatibleProjectsCaused} (${((incompatibleProjectsCaused / totalIncompatibleProjects) * 100).toFixed(2)}%)`);
  })

  console.log('All incompatible projects:');
  console.log('    - projectName (projectLicense) [dependentRepositoriesCount] -[*depth]-> incompatibleDependency (dependencyLicense)');
  incompatibleProjects.forEach(({projectName, projectLicense, depth, incompatibleDependency, dependencyLicense, dependentRepositoriesCount}) => {
    console.log(`    - ${projectName} (${projectLicense}) [${dependentRepositoriesCount}] -[*${depth}]-> ${incompatibleDependency} (${dependencyLicense})`);
  })
  console.log('All transitive incompatible projects:');
  console.log('    - projectName (projectLicense) [dependentRepositoriesCount] -[*depth]-> incompatibleDependency (dependencyLicense)');
  transitiveIncompatibleProjects.forEach(({projectName, projectLicense, depth, incompatibleDependency, dependencyLicense, dependentRepositoriesCount}) => {
    console.log(`    - ${projectName} (${projectLicense}) [${dependentRepositoriesCount}] -[*${depth}]-> ${incompatibleDependency} (${dependencyLicense})`);
  })
})


const setupExperiment = async () => {
  // Initial projects depth 1 - 2
  let depth = 2
  await labelCandidateProjects()
  await mergeVersions()
  await createVersionRequirements()
  await findIncompatibilities()
  await labelIncompatibleProjectsDepth()

  // Initial transitive projects
  await findTransitiveCandidateProjects()
  await mergeVersionsTransitive()
  await createVersionRequirementsTransitive(++depth)
  await cleanupTransitiveCandidates()

  // Arbitrarily deep transitive dependencies (reverse depth search)
  while ((await findArbitraryTransitiveCandidateProjects()) !== 0) {
    // Keep searching upwards
    console.log('**** Checking for further transitive incompatibilities at depth ' + ++depth + ' ****');
    await mergeVersionsTransitiveArbitrary()
    await createVersionRequirementsTransitiveArbitrary(depth)
    await cleanupArbitraryTransitiveCandidates()
  }
}

console.log('******* Setting up experiment *******');
await setupExperiment()
console.log('******* Done setting up experiment *******');

console.log('******* Running experiment *******');
await runExperiment()
console.log('******* Done running experiment *******');


driver.close()