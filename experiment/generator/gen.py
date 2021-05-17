import sys
import os

import dependencies
import projects
import versions
import licensesPermutations
import platformFilter

if (len(sys.argv) < 3):
    print('Invalid command line arguments, needed args:')
    print('$ python gen.py "librariesIoPath" "outputPath"')
    exit(0)

librariesIoDataPath = sys.argv[1]
outputPath = sys.argv[2]

print('-------------- Generating and cleaning CSV graph data --------------')


filterProjects = set()
if (len(sys.argv) > 3):
    platform = sys.argv[3]
    if (platform != None):
        filterProjects = platformFilter.filterByPlatform(librariesIoDataPath, platform)

projects.generate(outputPath, librariesIoDataPath, -1, filterProjects)
licensesPermutations.generate(outputPath, librariesIoDataPath)
dependencies.generate(outputPath, librariesIoDataPath, -1, filterProjects)
versions.generate(outputPath, librariesIoDataPath, -1, filterProjects)

