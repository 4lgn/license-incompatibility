import csv
import gzip
import os

def filterByPlatform(librariesIoDataPath, chosenPlatform):
    projectIds = set()

    print("Generating set of projects for platform", chosenPlatform)

    with open(os.path.join(librariesIoDataPath, 'projects-1.6.0-2020-01-12.csv'), "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        line_count = 0

        # skip first header line
        next(reader)
        for row in reader:
            line_count += 1
            if (line_count % 500000 == 0):
                print(line_count)

            index = row[0]
            platform = row[1]

            if (platform == chosenPlatform):
                projectIds.add(index)

    print("Generated", len(projectIds), "projects")

    return projectIds




