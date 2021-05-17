# Permissive
# 0, 36, 67, 184, 205 MIT and variations
# 48 X11
# 1, 26, 29 BSD-2-Clause
# 3, 50, 75, 142, 144, 214 BSD-3-Clause
# 4, 79, 237 Apache
# 8, 152 zlib
# 17 libpng

# 0, 36, 67, 184, 205, 48, 1, 26, 29, 3, 50, 75, 142, 144, 214, 4, 79, 237, 8, 152, 17


# Weak copyleft
# 70, 7 MPLv1.1 & MPLv2.0
# 10, 15, 18, 35, 42, 53, 58, 86, 125, 149, 151, 242 LGPLvX

# 70, 7, 10, 15, 18, 35, 42, 53, 58, 86, 125, 149, 151, 242

# Strong copyleft
# 2, 6, 11, 16, 19, 20, 33, 40, 85, 116, 139, 165, 215, 247, 249, 252 GPLvX (with certain exceptions)
# 25, 101, 124, 138 AGPLvX

# 2, 6, 11, 16, 19, 20, 33, 40, 85, 116, 139, 165, 215, 247, 249, 252, 25, 101, 124, 138


import csv
import gzip
import os

def generate(dbmsImportPath, librariesIoDataPath):
    print('Opening and writing the license incompatibility header file...')
    licenseIncompHeaderFile = open(os.path.join(dbmsImportPath, 'license-incompatibilities_header.csv'), "w", encoding="utf-8")
    licenseIncompHeaderFile.write('licenseId:START_ID(License),isIncompatibleWithLicenseId:END_ID(License)')
    licenseIncompHeaderFile.close()

    print('Opening license the license incompatibility file...')
    licenseIncompFile = open(os.path.join(dbmsImportPath, 'license-incompatibilities.csv'), "w", encoding="utf-8")

    permissive = [
        "MIT", "MIT-feh", "MIT-0",
        "MITNFA", "MIT-CMU", "X11",
        "BSD-2-Clause", "BSD-2-Clause-FreeBSD", "BSD-2-Clause-NetBSD",
        "BSD-3-Clause", "BSD-3-Clause-Attribution", "BSD-3-Clause-Clear",
        "BSD-3-Clause-No-Nuclear-Warranty", "BSD-3-Clause-No-Nuclear-License",
        "BSD-3-Clause-LBNL", "Apache-2.0", "Apache-1.0",
        "Apache-1.1", "Zlib", "zlib-acknowledgement",
        "Libpng"
    ]
    weakCopy = [
        "MPL-1.1", "MPL-2.0", "LGPL-3.0",
        "LGPL-2.1", "LGPL-2.0", "LGPL-3.0+",
        "LGPL-3.0-only", "LGPL-2.0+", "LGPL-2.1+",
        "LGPL-2.0-only", "LGPL-2.0-or-later", "LGPL-2.1-only",
        "LGPL-3.0-or-later", "LGPL-2.1-or-later"
    ]
    strongCopy = [
        "GPL-2.0", "GPL-3.0", "GPL-3.0-only",
        "GPL-3.0-or-later", "GPL-2.0+", "GPL-2.0-with-font-exception",
        "GPL-3.0+", "GPL-2.0-only", "GPL-2.0-or-later",
        "GPL-1.0-or-later", "GPL-1.0+", "GPL-2.0-with-classpath-exception",
        "GPL-3.0-with-GCC-exception", "GPL-2.0-with-GCC-exception", "GPL-1.0",
        "GPL-3.0-with-autoconf-exception", "AGPL-3.0", "AGPL-3.0-or-later",
        "AGPL-1.0", "AGPL-3.0-only"
    ]
    lgplVariations = [
        "LGPL-3.0", "LGPL-2.1", "LGPL-2.0",
        "LGPL-3.0+", "LGPL-3.0-only", "LGPL-2.0+",
        "LGPL-2.1+", "LGPL-2.0-only", "LGPL-2.0-or-later",
        "LGPL-2.1-only", "LGPL-3.0-or-later", "LGPL-2.1-or-later"
    ]


    print("Mapping found project licenses to their ids")

    licensesIdMap = dict()

    with open(os.path.join(dbmsImportPath, 'licenses.csv'), "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            licenseId = row[0]
            name = row[1]
            licensesIdMap[name] = licenseId

    print("Mapped " + str(len(licensesIdMap.keys())) + " licenses")

    line_count = 0

    print('Generating license incompatibility relationships...')
    # all permissive is incompatible with strong copyleft
    for p in permissive:
        # Can uncomment this if we want permissive to also be incompatible with weak copyleft
        # for w in weakCopy:
        #     if (p in licensesIdMap and w in licensesIdMap):
        #         line_count += 1
        #         license1Id = licensesIdMap[p]
        #         license2Id = licensesIdMap[w]
        #         licenseIncompFile.write(f'{license1Id},{license2Id}\n')
        for s in strongCopy:
            if (p in licensesIdMap and s in licensesIdMap):
                line_count += 1
                license1Id = licensesIdMap[p]
                license2Id = licensesIdMap[s]
                licenseIncompFile.write(f'{license1Id},{license2Id}\n')

    # MPLv1.1 is incompatible with LGPL
    for lgpl in lgplVariations:
        if (lgpl in licensesIdMap):
            line_count += 1
            licenseId = licensesIdMap[lgpl]
            licenseIncompFile.write(f'70,{licenseId}\n')
    


    

    print(f'Generated {line_count} possible license incompatibilities...')