import {
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
import React, { useState } from 'react'
import { useHistory } from 'react-router'

interface HomeViewProps {}

const HomeView: React.FC<HomeViewProps> = () => {
  const history = useHistory()

  return (
    <Center w="100%" h="100vh">
      <VStack spacing="4">
        <Box maxW="32rem">
          <Heading mb={4}>LICENSEMATE</Heading>
          <Text fontSize="xl">
            Ever needed to check your projects for license incompatabilities?
          </Text>
          <Button size="lg" colorScheme="green" mt="24px" onClick={() => history.push('/picker')}>
            Be license compliant now!
          </Button>
        </Box>
      </VStack>
    </Center>
  )
}

export default HomeView
