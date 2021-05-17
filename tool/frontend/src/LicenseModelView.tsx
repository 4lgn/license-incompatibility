import React, {
  useCallback,
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Checkbox,
  Flex,
  Input,
  Text,
  Tooltip,
} from '@chakra-ui/react'
import produce from 'immer'
import { useHistory } from 'react-router'
import LicenseMatrix from './LicenseMatrix'

export interface licenseIncompatability {
  id: number
  license1: string
  license2: string
  incompatible: boolean
}
interface LicenseModelViewProps {
  setLicenseIncompatabilities: Dispatch<
    SetStateAction<{ [incompatabilityId: number]: licenseIncompatability }>
  >
}

// Forgive me once more
export function cantorPair(x: number, y: number) {
  return 0.5 * (x + y) * (x + y + 1) + y
}

const defaultLicenses = [
  'MIT',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
  'LGPL-2.1',
  'LGPL-2.1+',
  'LGPL-3.0',
  'MPL-2.0',
  'EPL-1.0',
  'CDDL-1.0',
  'GPL-2.0',
  'GPL-2.0+',
  'GPL-3.0',
  'AGPL-1.0',
  'AGPL-3.0',
]

const LicenseModelView: React.FC<LicenseModelViewProps> = ({
  setLicenseIncompatabilities,
}) => {
  const [licenses, setLicenses] = useState<string[]>(defaultLicenses)
  const [licenseInput, setLicenseInput] = React.useState('')
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setLicenseInput(event.target.value)
  const [incompatibilities, setIncompatibilities] = useState<{
    [key: number]: licenseIncompatability
  }>({})
  const [isOpen, setIsOpen] = React.useState(false)
  const onClose = () => setIsOpen(false)
  const cancelRef = React.useRef<any>()
  const history = useHistory()

  const blocks = licenses.map(l => {
    return (
      <Text
        fontSize="12px"
        key={l}
        as="kbd"
        style={{ width: '100px', height: '50px' }}
      >
        {l}
      </Text>
    )
  })

  const editableBlocks = licenses.map((l1, j) => {
    return licenses.map((l2, k) => {
      const tooltipLabel = `Is ${l2} incompatible with ${l1}`
      const id = cantorPair(j, k)
      if (!incompatibilities[id]) {
        incompatibilities[id] = {
          id: id,
          license1: l2,
          license2: l1,
          incompatible: false,
        }
      }
      return (
        <div key={id} style={{ width: '100px', height: '50px' }}>
          <Tooltip label={tooltipLabel}>
            <div style={{ width: '16px', height: '16px' }}>
              <Checkbox
                alignItems="normal"
                isChecked={incompatibilities[id].incompatible}
                onChange={e => {
                  setIncompatibilities(
                    produce(incompatibilities, draft => {
                      draft[id].incompatible = e.target.checked
                    })
                  )
                }}
              ></Checkbox>
            </div>
          </Tooltip>
        </div>
      )
    })
  })

  return (
    <>
      <Flex flexDir="column" style={{ marginTop: '24px', marginLeft: '24px' }}>
        <Flex>
          <Button
            size="sm"
            colorScheme="green"
            maxWidth="240px"
            style={{ marginRight: '12px' }}
            onClick={() => setIsOpen(true)}
          >
            Load default model
          </Button>
          <Button
            style={{ marginRight: '12px' }}
            colorScheme="green"
            size="sm"
            maxWidth="240px"
            onClick={() => setIncompatibilities({})}
          >
            Clear model
          </Button>
          <Input
            size="sm"
            value={licenseInput}
            style={{ marginRight: '12px' }}
            maxWidth="240px"
            onChange={handleChange}
            placeholder="MIT"
          />
          <Button
            size="sm"
            style={{ marginRight: '12px' }}
            colorScheme="green"
            onClick={() => {
              if (licenseInput !== '') {
                setLicenses(
                  produce(licenses, draft => {
                    draft.push(licenseInput)
                  })
                )
                setLicenseInput('')
              }
            }}
          >
            Add license
          </Button>
          <Button
            size="sm"
            maxWidth="240px"
            colorScheme="green"
            style={{ marginRight: '12px' }}
            onClick={() => {
              setLicenseIncompatabilities(incompatibilities)
              history.push('/upload')
            }}
          >
            Save & Continue
          </Button>
        </Flex>
        <LicenseMatrix
          blocks={blocks}
          licenses={licenses}
          editableBlocks={editableBlocks}
        ></LicenseMatrix>
      </Flex>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Load default module
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? Your current changes will be lost.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="gray"
                onClick={() => {
                  setIncompatibilities(defaultModel)
                  onClose()
                }}
                ml={3}
              >
                Load
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}

const defaultModel = {
  '0': { id: 0, license2: 'MIT', license1: 'MIT', incompatible: false },
  '1': { id: 1, license2: 'BSD-2C', license1: 'MIT', incompatible: true },
  '2': { id: 2, license2: 'MIT', license1: 'BSD-2C', incompatible: false },
  '3': { id: 3, license2: 'BSD-3C', license1: 'MIT', incompatible: true },
  '4': { id: 4, license2: 'BSD-2C', license1: 'BSD-2C', incompatible: false },
  '5': { id: 5, license2: 'MIT', license1: 'BSD-3C', incompatible: false },
  '6': { id: 6, license2: 'APACHE-2', license1: 'MIT', incompatible: true },
  '7': { id: 7, license2: 'BSD-3C', license1: 'BSD-2C', incompatible: true },
  '8': { id: 8, license2: 'BSD-2C', license1: 'BSD-3C', incompatible: false },
  '9': { id: 9, license2: 'MIT', license1: 'APACHE-2', incompatible: false },
  '10': { id: 10, license2: 'LGPL-2.1', license1: 'MIT', incompatible: true },
  '11': {
    id: 11,
    license2: 'APACHE-2',
    license1: 'BSD-2C',
    incompatible: true,
  },
  '12': { id: 12, license2: 'BSD-3C', license1: 'BSD-3C', incompatible: false },
  '13': {
    id: 13,
    license2: 'BSD-2C',
    license1: 'APACHE-2',
    incompatible: false,
  },
  '14': { id: 14, license2: 'MIT', license1: 'LGPL-2.1', incompatible: false },
  '15': { id: 15, license2: 'LGPL-2.1+', license1: 'MIT', incompatible: true },
  '16': {
    id: 16,
    license2: 'LGPL-2.1',
    license1: 'BSD-2C',
    incompatible: true,
  },
  '17': {
    id: 17,
    license2: 'APACHE-2',
    license1: 'BSD-3C',
    incompatible: true,
  },
  '18': {
    id: 18,
    license2: 'BSD-3C',
    license1: 'APACHE-2',
    incompatible: false,
  },
  '19': {
    id: 19,
    license2: 'BSD-2C',
    license1: 'LGPL-2.1',
    incompatible: false,
  },
  '20': { id: 20, license2: 'MIT', license1: 'LGPL-2.1+', incompatible: false },
  '21': { id: 21, license2: 'LGPL-3', license1: 'MIT', incompatible: true },
  '22': {
    id: 22,
    license2: 'LGPL-2.1+',
    license1: 'BSD-2C',
    incompatible: true,
  },
  '23': {
    id: 23,
    license2: 'LGPL-2.1',
    license1: 'BSD-3C',
    incompatible: true,
  },
  '24': {
    id: 24,
    license2: 'APACHE-2',
    license1: 'APACHE-2',
    incompatible: false,
  },
  '25': {
    id: 25,
    license2: 'BSD-3C',
    license1: 'LGPL-2.1',
    incompatible: false,
  },
  '26': {
    id: 26,
    license2: 'BSD-2C',
    license1: 'LGPL-2.1+',
    incompatible: false,
  },
  '27': { id: 27, license2: 'MIT', license1: 'LGPL-3', incompatible: false },
  '28': { id: 28, license2: 'MPL-2', license1: 'MIT', incompatible: true },
  '29': { id: 29, license2: 'LGPL-3', license1: 'BSD-2C', incompatible: true },
  '30': {
    id: 30,
    license2: 'LGPL-2.1+',
    license1: 'BSD-3C',
    incompatible: true,
  },
  '31': {
    id: 31,
    license2: 'LGPL-2.1',
    license1: 'APACHE-2',
    incompatible: true,
  },
  '32': {
    id: 32,
    license2: 'APACHE-2',
    license1: 'LGPL-2.1',
    incompatible: true,
  },
  '33': {
    id: 33,
    license2: 'BSD-3C',
    license1: 'LGPL-2.1+',
    incompatible: false,
  },
  '34': { id: 34, license2: 'BSD-2C', license1: 'LGPL-3', incompatible: false },
  '35': { id: 35, license2: 'MIT', license1: 'MPL-2', incompatible: false },
  '36': { id: 36, license2: 'EPL-1', license1: 'MIT', incompatible: true },
  '37': { id: 37, license2: 'MPL-2', license1: 'BSD-2C', incompatible: true },
  '38': { id: 38, license2: 'LGPL-3', license1: 'BSD-3C', incompatible: true },
  '39': {
    id: 39,
    license2: 'LGPL-2.1+',
    license1: 'APACHE-2',
    incompatible: true,
  },
  '40': {
    id: 40,
    license2: 'LGPL-2.1',
    license1: 'LGPL-2.1',
    incompatible: false,
  },
  '41': {
    id: 41,
    license2: 'APACHE-2',
    license1: 'LGPL-2.1+',
    incompatible: true,
  },
  '42': { id: 42, license2: 'BSD-3C', license1: 'LGPL-3', incompatible: false },
  '43': { id: 43, license2: 'BSD-2C', license1: 'MPL-2', incompatible: false },
  '44': { id: 44, license2: 'MIT', license1: 'EPL-1', incompatible: false },
  '45': { id: 45, license2: 'CDDL-1', license1: 'MIT', incompatible: true },
  '46': { id: 46, license2: 'EPL-1', license1: 'BSD-2C', incompatible: true },
  '47': { id: 47, license2: 'MPL-2', license1: 'BSD-3C', incompatible: true },
  '48': {
    id: 48,
    license2: 'LGPL-3',
    license1: 'APACHE-2',
    incompatible: true,
  },
  '49': {
    id: 49,
    license2: 'LGPL-2.1+',
    license1: 'LGPL-2.1',
    incompatible: true,
  },
  '50': {
    id: 50,
    license2: 'LGPL-2.1',
    license1: 'LGPL-2.1+',
    incompatible: true,
  },
  '51': {
    id: 51,
    license2: 'APACHE-2',
    license1: 'LGPL-3',
    incompatible: false,
  },
  '52': { id: 52, license2: 'BSD-3C', license1: 'MPL-2', incompatible: false },
  '53': { id: 53, license2: 'BSD-2C', license1: 'EPL-1', incompatible: false },
  '54': { id: 54, license2: 'MIT', license1: 'CDDL-1', incompatible: false },
  '55': { id: 55, license2: 'GPL-2', license1: 'MIT', incompatible: true },
  '56': { id: 56, license2: 'CDDL-1', license1: 'BSD-2C', incompatible: true },
  '57': { id: 57, license2: 'EPL-1', license1: 'BSD-3C', incompatible: true },
  '58': {
    id: 58,
    license2: 'MPL-2',
    license1: 'APACHE-2',
    incompatible: true,
  },
  '59': {
    id: 59,
    license2: 'LGPL-3',
    license1: 'LGPL-2.1',
    incompatible: true,
  },
  '60': {
    id: 60,
    license2: 'LGPL-2.1+',
    license1: 'LGPL-2.1+',
    incompatible: false,
  },
  '61': {
    id: 61,
    license2: 'LGPL-2.1',
    license1: 'LGPL-3',
    incompatible: true,
  },
  '62': {
    id: 62,
    license2: 'APACHE-2',
    license1: 'MPL-2',
    incompatible: false,
  },
  '63': { id: 63, license2: 'BSD-3C', license1: 'EPL-1', incompatible: false },
  '64': { id: 64, license2: 'BSD-2C', license1: 'CDDL-1', incompatible: false },
  '65': { id: 65, license2: 'MIT', license1: 'GPL-2', incompatible: false },
  '66': { id: 66, license2: 'GPL-2+', license1: 'MIT', incompatible: true },
  '67': { id: 67, license2: 'GPL-2', license1: 'BSD-2C', incompatible: true },
  '68': { id: 68, license2: 'CDDL-1', license1: 'BSD-3C', incompatible: true },
  '69': {
    id: 69,
    license2: 'EPL-1',
    license1: 'APACHE-2',
    incompatible: true,
  },
  '70': {
    id: 70,
    license2: 'MPL-2',
    license1: 'LGPL-2.1',
    incompatible: false,
  },
  '71': {
    id: 71,
    license2: 'LGPL-3',
    license1: 'LGPL-2.1+',
    incompatible: true,
  },
  '72': {
    id: 72,
    license2: 'LGPL-2.1+',
    license1: 'LGPL-3',
    incompatible: false,
  },
  '73': {
    id: 73,
    license2: 'LGPL-2.1',
    license1: 'MPL-2',
    incompatible: false,
  },
  '74': {
    id: 74,
    license2: 'APACHE-2',
    license1: 'EPL-1',
    incompatible: false,
  },
  '75': { id: 75, license2: 'BSD-3C', license1: 'CDDL-1', incompatible: false },
  '76': { id: 76, license2: 'BSD-2C', license1: 'GPL-2', incompatible: false },
  '77': { id: 77, license2: 'MIT', license1: 'GPL-2+', incompatible: false },
  '78': { id: 78, license2: 'GPL-3', license1: 'MIT', incompatible: true },
  '79': { id: 79, license2: 'GPL-2+', license1: 'BSD-2C', incompatible: true },
  '80': { id: 80, license2: 'GPL-2', license1: 'BSD-3C', incompatible: true },
  '81': {
    id: 81,
    license2: 'CDDL-1',
    license1: 'APACHE-2',
    incompatible: true,
  },
  '82': {
    id: 82,
    license2: 'EPL-1',
    license1: 'LGPL-2.1',
    incompatible: true,
  },
  '83': {
    id: 83,
    license2: 'MPL-2',
    license1: 'LGPL-2.1+',
    incompatible: false,
  },
  '84': { id: 84, license2: 'LGPL-3', license1: 'LGPL-3', incompatible: false },
  '85': {
    id: 85,
    license2: 'LGPL-2.1+',
    license1: 'MPL-2',
    incompatible: false,
  },
  '86': {
    id: 86,
    license2: 'LGPL-2.1',
    license1: 'EPL-1',
    incompatible: true,
  },
  '87': {
    id: 87,
    license2: 'APACHE-2',
    license1: 'CDDL-1',
    incompatible: true,
  },
  '88': { id: 88, license2: 'BSD-3C', license1: 'GPL-2', incompatible: false },
  '89': { id: 89, license2: 'BSD-2C', license1: 'GPL-2+', incompatible: false },
  '90': { id: 90, license2: 'MIT', license1: 'GPL-3', incompatible: false },
  '91': { id: 91, license2: 'AGPL-1', license1: 'MIT', incompatible: true },
  '92': { id: 92, license2: 'GPL-3', license1: 'BSD-2C', incompatible: true },
  '93': { id: 93, license2: 'GPL-2+', license1: 'BSD-3C', incompatible: true },
  '94': {
    id: 94,
    license2: 'GPL-2',
    license1: 'APACHE-2',
    incompatible: true,
  },
  '95': {
    id: 95,
    license2: 'CDDL-1',
    license1: 'LGPL-2.1',
    incompatible: true,
  },
  '96': {
    id: 96,
    license2: 'EPL-1',
    license1: 'LGPL-2.1+',
    incompatible: true,
  },
  '97': { id: 97, license2: 'MPL-2', license1: 'LGPL-3', incompatible: false },
  '98': { id: 98, license2: 'LGPL-3', license1: 'MPL-2', incompatible: false },
  '99': {
    id: 99,
    license2: 'LGPL-2.1+',
    license1: 'EPL-1',
    incompatible: true,
  },
  '100': {
    id: 100,
    license2: 'LGPL-2.1',
    license1: 'CDDL-1',
    incompatible: true,
  },
  '101': {
    id: 101,
    license2: 'APACHE-2',
    license1: 'GPL-2',
    incompatible: true,
  },
  '102': {
    id: 102,
    license2: 'BSD-3C',
    license1: 'GPL-2+',
    incompatible: false,
  },
  '103': {
    id: 103,
    license2: 'BSD-2C',
    license1: 'GPL-3',
    incompatible: false,
  },
  '104': { id: 104, license2: 'MIT', license1: 'AGPL-1', incompatible: false },
  '105': { id: 105, license2: 'AGPL-3', license1: 'MIT', incompatible: true },
  '106': {
    id: 106,
    license2: 'AGPL-1',
    license1: 'BSD-2C',
    incompatible: true,
  },
  '107': {
    id: 107,
    license2: 'GPL-3',
    license1: 'BSD-3C',
    incompatible: true,
  },
  '108': {
    id: 108,
    license2: 'GPL-2+',
    license1: 'APACHE-2',
    incompatible: true,
  },
  '109': {
    id: 109,
    license2: 'GPL-2',
    license1: 'LGPL-2.1',
    incompatible: true,
  },
  '110': {
    id: 110,
    license2: 'CDDL-1',
    license1: 'LGPL-2.1+',
    incompatible: true,
  },
  '111': {
    id: 111,
    license2: 'EPL-1',
    license1: 'LGPL-3',
    incompatible: true,
  },
  '112': { id: 112, license2: 'MPL-2', license1: 'MPL-2', incompatible: false },
  '113': {
    id: 113,
    license2: 'LGPL-3',
    license1: 'EPL-1',
    incompatible: true,
  },
  '114': {
    id: 114,
    license2: 'LGPL-2.1+',
    license1: 'CDDL-1',
    incompatible: true,
  },
  '115': {
    id: 115,
    license2: 'LGPL-2.1',
    license1: 'GPL-2',
    incompatible: false,
  },
  '116': {
    id: 116,
    license2: 'APACHE-2',
    license1: 'GPL-2+',
    incompatible: true,
  },
  '117': {
    id: 117,
    license2: 'BSD-3C',
    license1: 'GPL-3',
    incompatible: false,
  },
  '118': {
    id: 118,
    license2: 'BSD-2C',
    license1: 'AGPL-1',
    incompatible: false,
  },
  '119': { id: 119, license2: 'MIT', license1: 'AGPL-3', incompatible: false },
  '121': {
    id: 121,
    license2: 'AGPL-3',
    license1: 'BSD-2C',
    incompatible: true,
  },
  '122': {
    id: 122,
    license2: 'AGPL-1',
    license1: 'BSD-3C',
    incompatible: true,
  },
  '123': {
    id: 123,
    license2: 'GPL-3',
    license1: 'APACHE-2',
    incompatible: true,
  },
  '124': {
    id: 124,
    license2: 'GPL-2+',
    license1: 'LGPL-2.1',
    incompatible: true,
  },
  '125': {
    id: 125,
    license2: 'GPL-2',
    license1: 'LGPL-2.1+',
    incompatible: true,
  },
  '126': {
    id: 126,
    license2: 'CDDL-1',
    license1: 'LGPL-3',
    incompatible: true,
  },
  '127': { id: 127, license2: 'EPL-1', license1: 'MPL-2', incompatible: false },
  '128': { id: 128, license2: 'MPL-2', license1: 'EPL-1', incompatible: true },
  '129': {
    id: 129,
    license2: 'LGPL-3',
    license1: 'CDDL-1',
    incompatible: true,
  },
  '130': {
    id: 130,
    license2: 'LGPL-2.1+',
    license1: 'GPL-2',
    incompatible: false,
  },
  '131': {
    id: 131,
    license2: 'LGPL-2.1',
    license1: 'GPL-2+',
    incompatible: true,
  },
  '132': {
    id: 132,
    license2: 'APACHE-2',
    license1: 'GPL-3',
    incompatible: false,
  },
  '133': {
    id: 133,
    license2: 'BSD-3C',
    license1: 'AGPL-1',
    incompatible: false,
  },
  '134': {
    id: 134,
    license2: 'BSD-2C',
    license1: 'AGPL-3',
    incompatible: false,
  },
  '138': {
    id: 138,
    license2: 'AGPL-3',
    license1: 'BSD-3C',
    incompatible: true,
  },
  '139': {
    id: 139,
    license2: 'AGPL-1',
    license1: 'APACHE-2',
    incompatible: true,
  },
  '140': {
    id: 140,
    license2: 'GPL-3',
    license1: 'LGPL-2.1',
    incompatible: true,
  },
  '141': {
    id: 141,
    license2: 'GPL-2+',
    license1: 'LGPL-2.1+',
    incompatible: true,
  },
  '142': {
    id: 142,
    license2: 'GPL-2',
    license1: 'LGPL-3',
    incompatible: true,
  },
  '143': {
    id: 143,
    license2: 'CDDL-1',
    license1: 'MPL-2',
    incompatible: true,
  },
  '144': { id: 144, license2: 'EPL-1', license1: 'EPL-1', incompatible: false },
  '145': {
    id: 145,
    license2: 'MPL-2',
    license1: 'CDDL-1',
    incompatible: true,
  },
  '146': {
    id: 146,
    license2: 'LGPL-3',
    license1: 'GPL-2',
    incompatible: true,
  },
  '147': {
    id: 147,
    license2: 'LGPL-2.1+',
    license1: 'GPL-2+',
    incompatible: false,
  },
  '148': {
    id: 148,
    license2: 'LGPL-2.1',
    license1: 'GPL-3',
    incompatible: true,
  },
  '149': {
    id: 149,
    license2: 'APACHE-2',
    license1: 'AGPL-1',
    incompatible: true,
  },
  '150': {
    id: 150,
    license2: 'BSD-3C',
    license1: 'AGPL-3',
    incompatible: false,
  },
  '156': {
    id: 156,
    license2: 'AGPL-3',
    license1: 'APACHE-2',
    incompatible: true,
  },
  '157': {
    id: 157,
    license2: 'AGPL-1',
    license1: 'LGPL-2.1',
    incompatible: true,
  },
  '158': {
    id: 158,
    license2: 'GPL-3',
    license1: 'LGPL-2.1+',
    incompatible: true,
  },
  '159': {
    id: 159,
    license2: 'GPL-2+',
    license1: 'LGPL-3',
    incompatible: true,
  },
  '160': { id: 160, license2: 'GPL-2', license1: 'MPL-2', incompatible: true },
  '161': {
    id: 161,
    license2: 'CDDL-1',
    license1: 'EPL-1',
    incompatible: true,
  },
  '162': {
    id: 162,
    license2: 'EPL-1',
    license1: 'CDDL-1',
    incompatible: false,
  },
  '163': { id: 163, license2: 'MPL-2', license1: 'GPL-2', incompatible: false },
  '164': {
    id: 164,
    license2: 'LGPL-3',
    license1: 'GPL-2+',
    incompatible: true,
  },
  '165': {
    id: 165,
    license2: 'LGPL-2.1+',
    license1: 'GPL-3',
    incompatible: false,
  },
  '166': {
    id: 166,
    license2: 'LGPL-2.1',
    license1: 'AGPL-1',
    incompatible: false,
  },
  '167': {
    id: 167,
    license2: 'APACHE-2',
    license1: 'AGPL-3',
    incompatible: false,
  },
  '175': {
    id: 175,
    license2: 'AGPL-3',
    license1: 'LGPL-2.1',
    incompatible: true,
  },
  '176': {
    id: 176,
    license2: 'AGPL-1',
    license1: 'LGPL-2.1+',
    incompatible: true,
  },
  '177': {
    id: 177,
    license2: 'GPL-3',
    license1: 'LGPL-3',
    incompatible: true,
  },
  '178': {
    id: 178,
    license2: 'GPL-2+',
    license1: 'MPL-2',
    incompatible: true,
  },
  '179': { id: 179, license2: 'GPL-2', license1: 'EPL-1', incompatible: true },
  '180': {
    id: 180,
    license2: 'CDDL-1',
    license1: 'CDDL-1',
    incompatible: false,
  },
  '181': { id: 181, license2: 'EPL-1', license1: 'GPL-2', incompatible: true },
  '182': {
    id: 182,
    license2: 'MPL-2',
    license1: 'GPL-2+',
    incompatible: false,
  },
  '183': {
    id: 183,
    license2: 'LGPL-3',
    license1: 'GPL-3',
    incompatible: false,
  },
  '184': {
    id: 184,
    license2: 'LGPL-2.1+',
    license1: 'AGPL-1',
    incompatible: false,
  },
  '185': {
    id: 185,
    license2: 'LGPL-2.1',
    license1: 'AGPL-3',
    incompatible: true,
  },
  '195': {
    id: 195,
    license2: 'AGPL-3',
    license1: 'LGPL-2.1+',
    incompatible: true,
  },
  '196': {
    id: 196,
    license2: 'AGPL-1',
    license1: 'LGPL-3',
    incompatible: true,
  },
  '197': { id: 197, license2: 'GPL-3', license1: 'MPL-2', incompatible: true },
  '198': {
    id: 198,
    license2: 'GPL-2+',
    license1: 'EPL-1',
    incompatible: true,
  },
  '199': {
    id: 199,
    license2: 'GPL-2',
    license1: 'CDDL-1',
    incompatible: true,
  },
  '200': {
    id: 200,
    license2: 'CDDL-1',
    license1: 'GPL-2',
    incompatible: true,
  },
  '201': {
    id: 201,
    license2: 'EPL-1',
    license1: 'GPL-2+',
    incompatible: true,
  },
  '202': { id: 202, license2: 'MPL-2', license1: 'GPL-3', incompatible: false },
  '203': {
    id: 203,
    license2: 'LGPL-3',
    license1: 'AGPL-1',
    incompatible: true,
  },
  '204': {
    id: 204,
    license2: 'LGPL-2.1+',
    license1: 'AGPL-3',
    incompatible: false,
  },
  '216': {
    id: 216,
    license2: 'AGPL-3',
    license1: 'LGPL-3',
    incompatible: true,
  },
  '217': {
    id: 217,
    license2: 'AGPL-1',
    license1: 'MPL-2',
    incompatible: true,
  },
  '218': { id: 218, license2: 'GPL-3', license1: 'EPL-1', incompatible: true },
  '219': {
    id: 219,
    license2: 'GPL-2+',
    license1: 'CDDL-1',
    incompatible: true,
  },
  '220': { id: 220, license2: 'GPL-2', license1: 'GPL-2', incompatible: false },
  '221': {
    id: 221,
    license2: 'CDDL-1',
    license1: 'GPL-2+',
    incompatible: true,
  },
  '222': { id: 222, license2: 'EPL-1', license1: 'GPL-3', incompatible: false },
  '223': {
    id: 223,
    license2: 'MPL-2',
    license1: 'AGPL-1',
    incompatible: false,
  },
  '224': {
    id: 224,
    license2: 'LGPL-3',
    license1: 'AGPL-3',
    incompatible: false,
  },
  '238': {
    id: 238,
    license2: 'AGPL-3',
    license1: 'MPL-2',
    incompatible: true,
  },
  '239': {
    id: 239,
    license2: 'AGPL-1',
    license1: 'EPL-1',
    incompatible: true,
  },
  '240': {
    id: 240,
    license2: 'GPL-3',
    license1: 'CDDL-1',
    incompatible: true,
  },
  '241': {
    id: 241,
    license2: 'GPL-2+',
    license1: 'GPL-2',
    incompatible: false,
  },
  '242': {
    id: 242,
    license2: 'GPL-2',
    license1: 'GPL-2+',
    incompatible: true,
  },
  '243': {
    id: 243,
    license2: 'CDDL-1',
    license1: 'GPL-3',
    incompatible: true,
  },
  '244': {
    id: 244,
    license2: 'EPL-1',
    license1: 'AGPL-1',
    incompatible: true,
  },
  '245': {
    id: 245,
    license2: 'MPL-2',
    license1: 'AGPL-3',
    incompatible: false,
  },
  '261': {
    id: 261,
    license2: 'AGPL-3',
    license1: 'EPL-1',
    incompatible: true,
  },
  '262': {
    id: 262,
    license2: 'AGPL-1',
    license1: 'CDDL-1',
    incompatible: true,
  },
  '263': { id: 263, license2: 'GPL-3', license1: 'GPL-2', incompatible: true },
  '264': {
    id: 264,
    license2: 'GPL-2+',
    license1: 'GPL-2+',
    incompatible: false,
  },
  '265': { id: 265, license2: 'GPL-2', license1: 'GPL-3', incompatible: true },
  '266': {
    id: 266,
    license2: 'CDDL-1',
    license1: 'AGPL-1',
    incompatible: true,
  },
  '267': {
    id: 267,
    license2: 'EPL-1',
    license1: 'AGPL-3',
    incompatible: false,
  },
  '285': {
    id: 285,
    license2: 'AGPL-3',
    license1: 'CDDL-1',
    incompatible: true,
  },
  '286': {
    id: 286,
    license2: 'AGPL-1',
    license1: 'GPL-2',
    incompatible: true,
  },
  '287': {
    id: 287,
    license2: 'GPL-3',
    license1: 'GPL-2+',
    incompatible: false,
  },
  '288': {
    id: 288,
    license2: 'GPL-2+',
    license1: 'GPL-3',
    incompatible: false,
  },
  '289': {
    id: 289,
    license2: 'GPL-2',
    license1: 'AGPL-1',
    incompatible: false,
  },
  '290': {
    id: 290,
    license2: 'CDDL-1',
    license1: 'AGPL-3',
    incompatible: true,
  },
  '310': {
    id: 310,
    license2: 'AGPL-3',
    license1: 'GPL-2',
    incompatible: true,
  },
  '311': {
    id: 311,
    license2: 'AGPL-1',
    license1: 'GPL-2+',
    incompatible: true,
  },
  '312': { id: 312, license2: 'GPL-3', license1: 'GPL-3', incompatible: false },
  '313': {
    id: 313,
    license2: 'GPL-2+',
    license1: 'AGPL-1',
    incompatible: false,
  },
  '314': {
    id: 314,
    license2: 'GPL-2',
    license1: 'AGPL-3',
    incompatible: true,
  },
  '336': {
    id: 336,
    license2: 'AGPL-3',
    license1: 'GPL-2+',
    incompatible: true,
  },
  '337': {
    id: 337,
    license2: 'AGPL-1',
    license1: 'GPL-3',
    incompatible: true,
  },
  '338': {
    id: 338,
    license2: 'GPL-3',
    license1: 'AGPL-1',
    incompatible: false,
  },
  '339': {
    id: 339,
    license2: 'GPL-2+',
    license1: 'AGPL-3',
    incompatible: false,
  },
  '363': {
    id: 363,
    license2: 'AGPL-3',
    license1: 'GPL-3',
    incompatible: true,
  },
  '364': {
    id: 364,
    license2: 'AGPL-1',
    license1: 'AGPL-1',
    incompatible: false,
  },
  '365': {
    id: 365,
    license2: 'GPL-3',
    license1: 'AGPL-3',
    incompatible: false,
  },
  '391': {
    id: 391,
    license2: 'AGPL-3',
    license1: 'AGPL-1',
    incompatible: true,
  },
  '392': {
    id: 392,
    license2: 'AGPL-1',
    license1: 'AGPL-3',
    incompatible: true,
  },
  '420': {
    id: 420,
    license2: 'AGPL-3',
    license1: 'AGPL-3',
    incompatible: false,
  },
}

export default LicenseModelView
