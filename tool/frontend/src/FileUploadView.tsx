import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Input,
  Link,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react'
import React, { useState, useEffect } from 'react'
import { licenseIncompatability } from '../../backend/src/db/insertIncompatabilities'
import socketIOClient from 'socket.io-client'
import { API_URL } from './constants'

interface BackendResponse {
  incompatibilities?: string[]
  error?: string
}

const ResponseView: React.FC<{ response: BackendResponse }> = ({
  response,
}) => {
  if (response.error) {
    return <Text>Error: {response.error}</Text>
  }
  if (response.incompatibilities && response.incompatibilities.length === 0) {
    return <Text>No incompatibilities found!</Text>
  }
  if (response.incompatibilities && response.incompatibilities.length > 0) {
    return (
      <VStack spacing="2">
        <Text>Found following incompatible projects:</Text>
        <Table>
          <Thead>
            <Tr>
              <Th>Project name</Th>
            </Tr>
          </Thead>
          <Tbody>
            {response.incompatibilities.map(incomp => (
              <Tr>
                <Td>
                  <Link
                    color="teal"
                    // TODO: Obviously make this generic across package managers
                    href={`https://www.npmjs.com/package/${incomp}`}
                  >
                    {incomp}
                  </Link>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    )
  }
  return null
}

interface FileUploadViewProps {
  licenseIncompatabilities: {
    [incompatabilityId: number]: licenseIncompatability
  }
}

const sessionId = Math.random().toString(36).substr(2, 9)

const FileUploadView: React.FC<FileUploadViewProps> = ({
  licenseIncompatabilities,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [response, setResponse] = useState<BackendResponse>({})
  //@ts-ignore
  let hiddenInput = null
  const [socketResponse, setSocketResponse] = useState('')

  useEffect(() => {
    const socket = socketIOClient(API_URL)
    socket.emit('connectInit', sessionId)
    socket.on('progress', (data: any) => {
      setSocketResponse(data)
    })
  }, [])

  return (
    <Center w="100%" h="100vh">
      <VStack spacing="4">
        <Box maxW="32rem">
          <Heading mb={4}>Upload your project</Heading>
          <Text fontSize="xl" mb="4">
            As the license-checker engine only looks at declared dependencies,
            you can simply upload your package managers manifest file e.g,
            package.json, pom.xml, etc.
          </Text>
          <Text>Selected file: {selectedFile?.name}</Text>
          <Button
            size="lg"
            colorScheme="green"
            mt="24px"
            style={{ marginRight: '12px' }}
            onClick={() => {
              //@ts-ignore
              hiddenInput.click()
            }}
          >
            Upload file
          </Button>
          <Input
            mb="4"
            hidden
            type="file"
            name="file"
            ref={el => (hiddenInput = el)}
            onChange={e => {
              const files = e.target.files
              if (files && files.length > 0) {
                const file = files[0]
                setSelectedFile(file)
              }
            }}
          />
          <Button
            disabled={selectedFile ? false : true}
            size="lg"
            colorScheme="green"
            mt="24px"
            onClick={async () => {
              if (!selectedFile) {
                alert('You must select a file')
                return
              }

              const formData = new FormData()
              formData.append('pm', selectedFile)
              formData.append(
                'licenseIncompatabilities',
                JSON.stringify(licenseIncompatabilities)
              )
              formData.append('sessionId', sessionId)

              try {
                setLoading(true)
                setResponse({})
                const res = await fetch(API_URL + '/parserino', {
                  method: 'POST',
                  body: formData,
                })
                const resJson: BackendResponse = await res.json()
                console.log(resJson)
                setLoading(false)
                setResponse(resJson)
                setSocketResponse('')
              } catch (e) {
                console.error(e)
                setLoading(false)
                setResponse({ error: e })
              }
            }}
          >
            {loading ? 'Checking...' : 'Check license compliance'}
          </Button>
          <div style={{ marginTop: '12px' }}>
            {socketResponse && socketResponse}
            <ResponseView response={response} />
          </div>
        </Box>
      </VStack>
    </Center>
  )
}

export default FileUploadView
