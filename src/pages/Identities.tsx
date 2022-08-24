import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Backdrop, Button, CircularProgress, Container, Grid, Stack, TextField, Typography } from '@mui/material'
import toast, { Toaster } from 'react-hot-toast'
import Web3Modal, { IProviderOptions } from 'web3modal'
import Web3 from 'web3'
import * as ethers from 'ethers'
import { identity, identityAbi, identityFactory, identityFactoryAbi } from '../constants/contracts'
import { Box } from '@mui/system'
import AccordionIdentity from '../components/AccordionIdentity'
import { LoadingButton } from '@mui/lab'
import AccordionErc from '../components/AccordionErc'

let providerOptions: IProviderOptions = {}
let web3Modal: Web3Modal

if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: 'mumbai',
    cacheProvider: true,
    providerOptions
  })
}

const Identities = (props: any) => {
  const [isConnect, setIsConnect] = useState(false)
  const [buttonDisabled, setButtonDisabled] = useState(true)
  const [savedProvider, setSavedProvider] = useState<any>(null)
  const [account, setAccount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [providedWeb3, setProvidedWeb3] = useState<Web3 | null>(null)
  const [information, setInformation] = useState<{ title: string; content: string }[] | []>([])
  const [identityContract, setIdentityContract] = useState('')
  const newIdentityContracts = information.filter(x => x.title === 'New Identity Contract' || x.title === 'Identity Contract added!')

  const isMetaMaskInstalled = () => {
    //Have to check the ethereum binding on the window object to see if it's installed
    const { ethereum } = window as any;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  const onClickConnect = async () => {
    try {
      if (!isConnect) {
        const provider = await web3Modal.connect()
        setSavedProvider(provider)
        setIsConnect(true)
      } else {
        await web3Modal.clearCachedProvider()
        setIsConnect(false)
        setAccount('')
        setSavedProvider(null)
        setButtonDisabled(true)
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message || 'Some error occured')
    }
  }

  const initAfterConnect = async () => {
    try {
      setIsLoading(true)
      const web3 = new Web3(savedProvider)
      const accounts = await web3.eth.getAccounts()
      
      setInformation([])
      const currentIdentityContract = localStorage.getItem('identity')
      if (currentIdentityContract !== null) {
        setInformation([...information, { title: 'Identity Contract added!', content: currentIdentityContract }, { content: accounts[0], title: 'Account' }])
      } else {
        setInformation([...information, { content: accounts[0], title: 'Account' }])
      }
      setAccount(accounts[0])
      setIsLoading(false)
      setProvidedWeb3(web3)
    } catch (error: any) {
      setIsLoading(false)
      toast.error(error.message || 'An error occured')
    }
  }

  const deployIdentities = async () => {
    try {
      setIsLoading(true)
      if (providedWeb3 !== null) {
        const identityContract = new providedWeb3.eth.Contract(identityAbi as any, identity)
        const identitiesFactory = new providedWeb3.eth.Contract(identityFactoryAbi as any, identityFactory)
        
        const identityOwner = await identityContract.methods.owner().call({ from: account })
        if (identityOwner === account) {
          toast.success(`You're the owner of the identities`)
          const deployingIdentities = await identitiesFactory.methods.deployIdentity().send({ from: account })
          if (deployingIdentities) {
            const newIdentityAddress = deployingIdentities.events.IdentityDeployed.returnValues._contract
            console.log(newIdentityAddress, '@newContract?')
            setInformation([...information, { title: 'New Identity Contract', content: newIdentityAddress }])
            setIsLoading(false)
          }
        } else {
          toast.error(`You're not the owner of the identities factory contract`)
          setIsLoading(false)
        }
      } else {
        toast.error('Web3 is not provided!')
        setIsLoading(false)
      }
    } catch (error: any) {
      setIsLoading(false)
      console.log(error, '@error?')
      toast.error(error.message || 'An error occured')
    }
  }

  const setNewIdentityContract = () => {
    if (identityContract !== '') {
      localStorage.setItem('identity', identityContract)
      toast.success(`Success added ${identityContract}`)
      setInformation([...information, { title: 'Identity Contract added!', content: identityContract }])
    }
  }

  useEffect(() => {
    const isMetamask = isMetaMaskInstalled()
    if (!isMetamask) {
      toast.error('No metamask installed')
      setButtonDisabled(true)
    }
  }, [])

  useEffect(() => {
    if (isConnect) {
      setButtonDisabled(false)
    }
  }, [isConnect])

  useEffect(() => {
    if (savedProvider !== null) {
      initAfterConnect()
    }
  }, [savedProvider])

  useEffect(() => {
    if (information.length > 0) {
      const filteredInformation = information.filter(x => x.content === account)
      const infoNoAccount = information.filter(x => x.content !== account)
      if (filteredInformation.length > 1) {
        setInformation([...infoNoAccount, filteredInformation[0]])
      }
    }
  }, [information])

  useEffect(() => {
    if (savedProvider?.on) {
      savedProvider?.on('accountsChanged', (acc: string[]) => {
        console.info('Account changed = ', acc[0])
        initAfterConnect()
      })
      savedProvider?.on('chainChanged', (chainId: number) => {
        if (chainId !== 80001) {
          toast.error('Please use mumbai network')
        }
      })
    }
  }, [savedProvider])

  return (
    <div>
      <Container>
        <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center" style={{ minHeight: '100vh' }}>
          <Grid item>
            <Stack direction='row' spacing={4}>
              <Button sx={{ backgroundColor: isConnect ? 'red' : 'blue', color: 'white' }} onClick={onClickConnect} variant='contained'>{isConnect ? `Disconnect` : `Connect`}</Button>
              <Button sx={{ backgroundColor: 'green', color: 'white' }} variant='contained' onClick={deployIdentities}>Deploy identities</Button>
            </Stack>
          </Grid>
          {
            (isConnect && localStorage.getItem('identity') === '') ? (
              <Grid item>
                <Stack direction='row' spacing={4}>
                  <TextField
                    label="Contract Address"
                    id="outlined-size-small"
                    size="small"
                    placeholder='0x'
                    onChange={(e) => setIdentityContract(e.target.value)}
                  />
                  <LoadingButton variant='contained' sx={{ backgroundColor: 'blue', color: 'white' }} onClick={setNewIdentityContract}>Send</LoadingButton>
                </Stack>
              </Grid>
            ) : (null)
          }
          <Grid item>
            <Stack direction='column' spacing={0} alignItems='center'>
              <h1>Welcome!</h1>
              {!isConnect && <code style={{ padding: 4, backgroundColor: 'gray', borderRadius: 4, color: 'white' }}>Please connect to metamask</code>}
            </Stack>
          </Grid>
          <Grid item>
            <Box sx={{ borderRadius: 4, backgroundColor: '#D6D6D6', width: 700, height: 100, p: 2, overflowY: 'scroll' }}>
              <Typography textAlign={'center'} fontWeight='bold' fontSize={23} mb={2}>Information ℹ️</Typography>
              <Stack direction='column' spacing={2}>
                {
                  information.map((x, i) => (
                    <code key={i}>{x.title}: {x.content}</code>
                  ))
                }
              </Stack>
            </Box>
          </Grid>
          <Grid item>
            {
              (newIdentityContracts.length > 0 && savedProvider !== null) && (
                <AccordionIdentity provider={savedProvider} contractAddr={newIdentityContracts[0].content} />
              )
            }
          </Grid>
          <Grid item>
            {
              (savedProvider !== null && newIdentityContracts.length > 0 ) && (
                <AccordionErc provider={savedProvider} identityContractAddr={newIdentityContracts[0].content} />
              )
            }
          </Grid>
        </Grid>
      </Container>
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
        onClick={() => setIsLoading(false)}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  )
}

Identities.propTypes = {}

export default Identities