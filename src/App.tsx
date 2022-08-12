import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Backdrop, Button, CircularProgress, Container, Grid, Stack } from '@mui/material'
import toast, { Toaster } from 'react-hot-toast'
import Web3Modal, { IProviderOptions } from 'web3modal'
import Web3 from 'web3'
import AccordionInfo from './components/AccordionInfo'
import { GSNConfig, RelayProvider } from '@opengsn/provider'
import { capture, captureAbi, paymaster } from './constants/contracts';
import { ethers } from 'ethers';

let providerOptions: IProviderOptions = {}
let web3Modal: Web3Modal

if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: 'mumbai',
    cacheProvider: true,
    providerOptions
  })
}

const relayConfig: Partial<GSNConfig> = {
  paymasterAddress: paymaster,
  loggerConfiguration: {
    logLevel: 'info',
    // loggerUrl: 'logger.opengsn.org',
  },
  // @ts-ignore
  relayLookupWindowBlocks: 1e5,
  relayRegistrationLookupBlocks: 1e5,
  pastEventsQueryMaxPageSize: 2e4,
}

const mumbaiProvider = new ethers.providers.JsonRpcProvider('https://polygon-mumbai.infura.io/v3/2abf317ac68f47b1890e187c552dcdc1')

function App() {
  const [isConnect, setIsConnect] = useState(false)
  const [buttonDisabled, setButtonDisabled] = useState(true)
  const [savedProvider, setSavedProvider] = useState<any>(null)
  const [account, setAccount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [relayProvider, setRelayProvider] = useState<RelayProvider | null>(null)

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
      const gsnProvider = await RelayProvider.newProvider({ provider: savedProvider, config: relayConfig })
      await gsnProvider.init()

      setAccount(accounts[0])
      setRelayProvider(gsnProvider)
      setIsLoading(false)
    } catch (error: any) {
      setIsLoading(false)
      toast.error(error.message || 'An error occured')
    }
  }

  const getEstimatedGasPrice = async () => await mumbaiProvider.getGasPrice()
  const populateContract = async (contract: ethers.Contract, method: string, ...param: any[]) => await contract.populateTransaction[method](...param)
  const estimatingGasForContract = async (contract: ethers.Contract, method: string, value: ethers.BigNumber, ...param: any[]) => await contract.estimateGas[method](...param, { from: account })
  const sendTransaction = async (data: ethers.utils.Deferrable<ethers.providers.TransactionRequest>) => {
    try {
      setIsLoading(true)
      if (account === '') {
        toast.error('User not connected!')
        return
      }
      const web3 = new ethers.providers.Web3Provider(relayProvider as any)
      const sendTx = await web3.getSigner(account).sendTransaction(data)
      await sendTx.wait()
  
      return sendTx
    } catch (error: any) {
      setIsLoading(false)
      toast.error(error.message || 'Error')
    }
  }
  const capturingTheFlags = async () => {
    try {
      setIsLoading(true)
      const captureContract = new ethers.Contract(capture, captureAbi, mumbaiProvider)
      const gasPrice = await getEstimatedGasPrice()
      const data = await populateContract(captureContract, 'captureTheFlags')
      const gasLimit = await estimatingGasForContract(captureContract, 'captureTheFlags', ethers.BigNumber.from(0))
      const txData: ethers.utils.Deferrable<ethers.providers.TransactionRequest> = {
        from: account,
        to: data.to,
        data: data.data,
        nonce: mumbaiProvider.getTransactionCount(account),
        gasPrice,
        gasLimit
      }
      await sendTransaction(txData)
      toast.success('Success!')
      setIsLoading(false)

    } catch (error: any) {
      setIsLoading(false)
      toast.error(error.message || 'Error!')
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

  return (
    <div>
      <Container>
        <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center" style={{ minHeight: '100vh' }}>
          <Grid item>
            <Stack direction='column' spacing={0} alignItems='center'>
              <h1>Welcome!</h1>
              {!isConnect && <code style={{ padding: 4, backgroundColor: 'gray', borderRadius: 4, color: 'white' }}>Please connect to metamask</code>}
            </Stack>
          </Grid>
          <Grid item>
            <Stack direction='row' spacing={4}>
              <Button sx={{ backgroundColor: isConnect ? 'red' : 'blue', color: 'white' }} onClick={onClickConnect} variant='contained'>{isConnect ? `Disconnect` : `Connect`}</Button>
              <Button sx={{ backgroundColor: 'gray', color: 'white' }} variant='contained' disabled={buttonDisabled} onClick={capturingTheFlags}>Capture the flag!</Button>
            </Stack>
          </Grid>
          <Grid item>
            {savedProvider !== null && <AccordionInfo provider={savedProvider} />}
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
  );
}

export default App;
