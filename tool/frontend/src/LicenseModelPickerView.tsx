import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react'
import React, { Dispatch, SetStateAction, useState } from 'react'
import { useHistory } from 'react-router'
import UploadCSV from './UploadCSV';
import { licenseIncompatability } from './LicenseModelView';
import { CSVDownloader } from 'react-papaparse';
import DownloadCSV from './DownloadCSV';

interface LicenseModelPickerViewProps {
  setLicenseIncompatabilities: Dispatch<
  SetStateAction<{ [incompatabilityId: number]: licenseIncompatability }>
>
}

const LicenseModelPickerView: React.FC<LicenseModelPickerViewProps> = ({
  setLicenseIncompatabilities
}) => {
  const history = useHistory()

  const onUpload = (incompatibilities: { [id: number]: licenseIncompatability}) => {
    setLicenseIncompatabilities(incompatibilities)
    history.push('/upload')
  }

  return (
    <>
      <Center w="100%" h="100vh">
        <VStack spacing="4">
          <Box maxW="32rem">
            <Heading mb={4}>Pick your license model</Heading>
            <Text fontSize="xl">
              In order to check your project for license incompatabilities you
              need to select a incompatability model. Download and modify the CSV to fit your needs and afterwards upload it.
            </Text>
            <Flex>
              <UploadCSV onUpload={onUpload}></UploadCSV>
              <Button
                size="lg"
                colorScheme="green"
                mt="24px"
                style={{ marginRight: '12px' }}
                onClick={() => console.log("download CSV")}
              >
                <DownloadCSV></DownloadCSV>
              </Button>
              <Button
                size="lg"
                colorScheme="green"
                mt="24px"
                onClick={() => {
                  setLicenseIncompatabilities({})
                  history.push('/upload')
                }}
              >
                Use default model
              </Button>
            </Flex>
          </Box>
        </VStack>
      </Center>
    </>
  )
}

export default LicenseModelPickerView
