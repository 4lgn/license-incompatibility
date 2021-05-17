import csv
import gzip
import re
import os

def generate(dbmsImportPath, librariesIoDataPath, cutoff = -1, filterProjects = set()):
    print('Opening and writing version header files...')
    versionsHeaderFile = open(os.path.join(dbmsImportPath, 'versions_header.csv'), "w+", encoding="utf-8")
    projectVersionsHeaderFile = open(os.path.join(dbmsImportPath, 'project-versions_header.csv'), "w+", encoding="utf-8")
    versionsHeaderFile.write('versionId:ID(Version),number')
    projectVersionsHeaderFile.write('projectId:START_ID(Project),versionId:END_ID(Version)')
    versionsHeaderFile.close()
    projectVersionsHeaderFile.close()

    print('Opening version files...')
    versionsFile = open(os.path.join(dbmsImportPath, 'versions.csv'), "w", encoding="utf-8")
    projectVersionsFile = open(os.path.join(dbmsImportPath, 'project-versions.csv'), "w", encoding="utf-8")

    print('Generating versions...')
    with open(os.path.join(librariesIoDataPath, 'versions-1.6.0-2020-01-12.csv'), "r", encoding="utf-8") as f:
        reader = csv.reader(f)
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
            projectId = row[3]
            versionNumber = row[4]

            # Skip all projects that we should filter
            if (len(filterProjects) > 0 and (not filterProjects.__contains__(projectId))):
                continue
                
            versionNumberFiltered = versionNumber.replace('"', "'")

            versionsFile.write(f'{index},"{versionNumberFiltered}"\n')
            projectVersionsFile.write(f'{projectId},{index}\n')


    print(f'Generated {line_count} version nodes...')

    versionsFile.close()
    projectVersionsFile.close()
