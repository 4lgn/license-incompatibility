import csv
import gzip
import os

def generate(dbmsImportPath, librariesIoDataPath, cutoff = -1, filterProjects = set()):
    print('Opening and writing project header files...')
    projectsHeaderFile = open(os.path.join(dbmsImportPath, 'projects_header.csv'), "w+", encoding="utf-8")
    licensesHeaderFile = open(os.path.join(dbmsImportPath, 'licenses_header.csv'), "w+", encoding="utf-8")
    projectLicensesHeaderFile = open(os.path.join(dbmsImportPath, 'project-licenses_header.csv'), "w+", encoding="utf-8")
    projectsHeaderFile.write('projectId:ID(Project),platform,name,dependentRepositoriesCount')
    licensesHeaderFile.write('licenseId:ID(License),name')
    projectLicensesHeaderFile.write('projectId:START_ID(Project),licenseId:END_ID(License)')
    projectsHeaderFile.close()
    licensesHeaderFile.close()
    projectLicensesHeaderFile.close()

    print('Opening project files...')
    projectsFile = open(os.path.join(dbmsImportPath, 'projects.csv'), "w", encoding="utf-8")
    licensesFile = open(os.path.join(dbmsImportPath, 'licenses.csv'), "w", encoding="utf-8")
    projectLicensesFile = open(os.path.join(dbmsImportPath, 'project-licenses.csv'), "w", encoding="utf-8")

    licensesMap = {}
    licensesId = 0

    print('Generating projects...')
    with open(os.path.join(librariesIoDataPath, "projects-1.6.0-2020-01-12.csv"), "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        projectsWritten = 0
        dualLicensedProjects = 0
        line_count = 0

        # skip first header line
        next(reader)
        for row in reader:
            if (cutoff != -1 and line_count > cutoff):
                break
            line_count += 1
            if (line_count % 500000 == 0):
                print(line_count)


            index = row[0]
            platform = row[1]
            name = row[2]
            licenses = row[8]
            dependentRepositoriesCount = row[19]

            # Skip all projects that we should filter
            if (len(filterProjects) > 0 and (not filterProjects.__contains__(index))):
                continue

            projectNameFiltered = name.replace('"', "'")

            if (licenses):
                licenseArr = licenses.split(',')

                # Skip licensing dual-licensed projects (we still need the
                # project nodes for dependency chains, but we cannot answer
                # anything with regards to their license because we have no
                # idea which parts of the software are licensed under which
                # license)
                if (len(licenseArr) == 1):
                    license = licenseArr[0]
                    if (not license in licensesMap):
                        licensesMap[license] = licensesId
                        licensesFile.write(f'{licensesId},{license}\n')
                        licensesId += 1
                    licenseId = licensesMap.get(license)
                    projectLicensesFile.write(f'{index},{licenseId}\n')
                else:
                    dualLicensedProjects += 1

                

            projectsWritten += 1
            projectsFile.write(f'{index},{platform},"{projectNameFiltered}",{dependentRepositoriesCount}\n')

    print(f'Generated {projectsWritten} project nodes (skipped {line_count - projectsWritten}) with {dualLicensedProjects} of them being dual-licensed, and {licensesId} unique licenses...')

    projectsFile.close()
    licensesFile.close()
    projectLicensesFile.close()
    
