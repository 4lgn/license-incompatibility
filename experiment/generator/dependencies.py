import csv
import gzip
import re
import os

def generate(dbmsImportPath, librariesIoDataPath, cutoff = -1, filterProjects = set()):
    print('Opening and writing dependency header files...')
    projectsDependenciesHeaderFile = open(os.path.join(dbmsImportPath, 'project-dependencies_header.csv'), "w+", encoding="utf-8")
    versionDependenciesHeaderFile = open(os.path.join(dbmsImportPath, 'version-dependencies_header.csv'), "w+", encoding="utf-8")
    projectsDependenciesHeaderFile.write('projectId:START_ID(Project),dependencyProjectId:END_ID(Project)')
    versionDependenciesHeaderFile.write('versionId:START_ID(Version),dependencyRequirement,dependencyProjectId:END_ID(Project)')
    projectsDependenciesHeaderFile.close()
    versionDependenciesHeaderFile.close()

    print('Opening dependency files...')
    projectDependenciesFile = open(os.path.join(dbmsImportPath, 'project-dependencies.csv'), "w", encoding="utf-8")
    versionDependenciesFile = open(os.path.join(dbmsImportPath, 'version-dependencies.csv'), "w", encoding="utf-8")

    relationSet = set()

    print('Generating dependencies...')
    with open(os.path.join(librariesIoDataPath, "dependencies-1.6.0-2020-01-12.csv"), "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        dependenciesWritten = 0
        line_count = 0
        cyclicDependencies = 0
        optionalDependencies = 0

        # skip first header line
        next(reader)
        for row in reader:
            if (cutoff != -1 and line_count > cutoff):
                break
            line_count += 1
            if (line_count % 500000 == 0):
                print(line_count)

            projectId = row[3]
            dependencyVersion = row[4]
            dependencyVersionId = row[5]
            dependencyKind = row[8]
            optionalDependency = row[9]
            dependencyReqs = row[10]
            dependencyProjectId = row[11]

            # Skip cyclic dependencies
            if (projectId == dependencyProjectId):
                cyclicDependencies += 1
                continue

            # Skip optional dependency
            if (optionalDependency == 'true'):
                optionalDependencies += 1
                continue

            # If we have filterProjects defined, skip all projects we don't have in our filter
            if (len(filterProjects) > 0 and (not (filterProjects.__contains__(projectId) or filterProjects.__contains__(dependencyProjectId)))):
                continue

            if (not dependencyKind in ['runtime','RUNTIME', 'compile', 'COMPILE', 'provided', 'normal', 'build', 'imports', 'import', 'configure', 'depends', 'system']):
                continue

            if (projectId and dependencyProjectId and dependencyVersion and dependencyKind):
                dependenciesWritten += 1

                dependencyReqVersionFiltered = dependencyReqs.replace('"', "'")

                versionDependenciesFile.write(f'{dependencyVersionId},"{dependencyReqVersionFiltered}",{dependencyProjectId}\n')
                if (dependencyProjectId.isnumeric()):
                    if (not relationSet.__contains__((projectId, dependencyProjectId))):
                        relationSet.add((projectId, dependencyProjectId))
                        projectDependenciesFile.write(f'{projectId},{dependencyProjectId}\n')

    print(f'Generated {dependenciesWritten} dependency nodes (skipped {line_count - dependenciesWritten})...')
    print(f'... with {cyclicDependencies} of them being cyclic dependencies and {optionalDependencies} being optional (skipped)')

    versionDependenciesFile.close()
    projectDependenciesFile.close()
