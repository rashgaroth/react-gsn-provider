/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import toast from 'react-hot-toast';
import Web3 from 'web3';
import { Button, CircularProgress, Divider, Grid, Link, Stack, TextField } from '@mui/material';
import { toSmallUnit } from '../helpers/strings';
import { ethers } from 'ethers';
import { LoadingButton } from '@mui/lab';
import { identity, identityAbi } from '../constants/contracts';
import { FormatTypes, Interface } from 'ethers/lib/utils';
import { addClaimData, signMessage } from '../helpers/ethers';

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&:before': {
    display: 'none',
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, .05)'
      : 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

export default function AccordionIdentity({ provider = null, contractAddr = '' }: { provider: any; contractAddr: string }) {
  const [expanded, setExpanded] = React.useState<string | false>('');
  const [transactionValue, setTransactionValue] = React.useState('')
  const [loadingButton, setLoadingButton] = React.useState(false)
  const [contractBalance, setContractBalance] = React.useState(0)
  const [contractState, setContractState] = React.useState({
    owner: '',
    ownersCount: 0,
    isOwner: false,
    signMessage: ''
  })
  const [formState, setFormState] = React.useState({
    addOwner: '',
    signMessage: ''
  })

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  const initNetworkInfo = async () => {
    try {
      const iIdentityContractInterface = new Interface(identityAbi)
      iIdentityContractInterface.format(FormatTypes.full)

      const providedWeb3 = new ethers.providers.Web3Provider(provider)
      const balance = await (await providedWeb3.getBalance(contractAddr)).toString()
      const actualBalanceOfContract = toSmallUnit(parseInt(balance), 18)
      const signer = await providedWeb3.getSigner()
      const userAddress = signer.getAddress()

      const contract = new ethers.Contract(contractAddr, iIdentityContractInterface, signer)
      const owner = await contract.owner()
      const ownersCount = await contract.additionalOwnersCount()
      const isOwner = await contract.additionalOwners(userAddress)

      setContractState((curr) => ({
        ...curr,
        owner,
        ownersCount,
        isOwner
      }))
      setContractBalance(actualBalanceOfContract)
    } catch (error: any) {
      toast.error(error.message || 'Some Error Occured!')
    }
  }

  const sendTransaction = async () => {
    try {
      if (contractAddr !== '') {
        setLoadingButton(true)
        const providedWeb3 = new ethers.providers.Web3Provider(provider)
        const val = ethers.utils.parseEther(transactionValue !== '' ? transactionValue : '0').toString()
        const signer = await providedWeb3.getSigner()
        const fundingTx = await signer.sendTransaction({ value: val, to: contractAddr })
        await fundingTx.wait()
        toast.success(`Success send ${transactionValue} MUMBAI to ${contractAddr}`)
        setLoadingButton(false)
      } else {
        toast.error('No contract provided')
      }
    } catch (error: any) {
      setLoadingButton(false)
      toast.error(error.message || 'Error')
    }
  }

  const addOwner = async () => {
    try {
      setLoadingButton(true)
      const providedWeb3 = new ethers.providers.Web3Provider(provider)
      const iIdentityContractInterface = new Interface(identityAbi)
      iIdentityContractInterface.format(FormatTypes.full)
      const signer = await providedWeb3.getSigner()
      const contract = new ethers.Contract(contractAddr, iIdentityContractInterface, signer)

      await toast.promise(
        contract.addAdditionalOwner(formState.addOwner),
        {
          loading: `Add owner ${formState.addOwner}`,
          error: `Some error occured`,
          success: `Success add owner`
        }
      )
      await initNetworkInfo()
      setLoadingButton(false)
    } catch (error: any) {
      setLoadingButton(false)
      toast.error(error.message || 'Error')
    }
  }

  const addClaim = async () => {
    try {
      setLoadingButton(true)
      const providedWeb3 = new ethers.providers.Web3Provider(provider)
      const signer = await providedWeb3.getSigner()
      const address = await signer.getAddress()

      const claimData = {
        identifier: "nft_mint_allowed",
        from: address,
        to: contractAddr,
        data: ethers.utils.formatBytes32String(""),
      };

      await addClaimData(contractState.signMessage, provider, contractAddr, claimData)
      setLoadingButton(false)
    } catch (error: any) {
      setLoadingButton(false)
      toast.error(error.message || 'Error')
    }
  }

  const onSign = async () => {
    const hash = await signMessage(contractAddr, provider, () => {})
    setContractState((curr) => ({
      ...curr,
      signMessage: hash
    }))
  }

  React.useEffect(() => {
    if (provider !== null) {
      initNetworkInfo()
    }
  }, [provider])

  return (
    <div>
      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')} sx={{ borderRadius: 4, width: 700 }}>
        <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
          <Stack direction='row' spacing={4} alignItems='center'>
            <Typography>{expanded === 'panel1' ? 'Hide' : 'Show'} Identity Actions</Typography>
            {loadingButton && <CircularProgress sx={{ width: 20, height: 20 }} size={20} />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container direction='column' spacing={1}>
            <Grid item>
              <Stack direction='column' spacing={0}>
                <Typography fontWeight={'bold'}>Send MATIC</Typography>
                <Stack direction='row' spacing={4}>
                  <TextField
                    label="Value"
                    id="outlined-size-small"
                    size="small"
                    placeholder='0'
                    onChange={(e) => setTransactionValue(e.target.value)}
                  />
                  <LoadingButton variant='contained' sx={{ backgroundColor: 'blue', color: 'white' }} onClick={sendTransaction} disabled={loadingButton}>Send</LoadingButton>
                </Stack>
              </Stack>
            </Grid>
            <Grid item>
              <Divider variant='middle' /> 
            </Grid>
            <Grid item>
              <Stack direction='column' spacing={0}>
                <Typography fontWeight={'bold'}>Balance</Typography>
                <Typography>{contractBalance} MATIC</Typography>
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction='column' spacing={0}>
                <Typography fontWeight={'bold'}>Owner</Typography>
                <Typography component="a" href={`https://mumbai.polygonscan.com/address/${contractState.owner}`} target={'_blank'}>{contractState.owner}</Typography>
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction='column' spacing={0}>
                <Typography fontWeight={'bold'}>Owners Count</Typography>
                <Typography>{contractState.ownersCount}</Typography>
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction='column' spacing={0}>
                <Typography fontWeight={'bold'}>Is Owner</Typography>
                {contractState.isOwner ? <Typography sx={{ color: 'green' }} fontWeight='bold'>Yes</Typography> : <Typography sx={{ color: 'red' }} fontWeight='bold'>No</Typography>}
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction='column' spacing={0}>
                <Typography fontWeight={'bold'}>Add Owner</Typography>
                <Stack direction='row' spacing={4}>
                  <TextField
                    label="Owner Address"
                    id="outlined-size-small"
                    size="small"
                    placeholder='0x'
                    onChange={(e) => setFormState((curr) => ({ ...curr, addOwner: e.target.value }))}
                  />
                  <LoadingButton variant='contained' sx={{ backgroundColor: 'blue', color: 'white' }} onClick={addOwner} disabled={loadingButton}>Send</LoadingButton>
                </Stack>
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction='column' spacing={0}>
                <Typography fontWeight={'bold'}>Sign Message</Typography>
                <Typography>{contractState.signMessage}</Typography>
                <Stack direction='row' spacing={4}>
                  <LoadingButton variant='contained' sx={{ backgroundColor: 'blue', color: 'white' }} onClick={onSign} disabled={loadingButton}>Send</LoadingButton>
                </Stack>
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction='column' spacing={0}>
                <Typography fontWeight={'bold'}>Add Claim</Typography>
                <Stack direction='row' spacing={4}>
                  <TextField
                    label="Signed Message"
                    id="outlined-size-small"
                    size="small"
                    placeholder='hash'
                    onChange={(e) => setFormState((curr) => ({ ...curr, signMessage: e.target.value }))}
                  />
                  <LoadingButton variant='contained' sx={{ backgroundColor: 'blue', color: 'white' }} onClick={addClaim} disabled={loadingButton || contractState.signMessage === ''}>Send</LoadingButton>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
