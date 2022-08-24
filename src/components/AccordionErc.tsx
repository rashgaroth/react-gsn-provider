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
import { Grid, Stack } from '@mui/material';
import { toSmallUnit } from '../helpers/strings';
import { LoadingButton } from '@mui/lab';
import { ethers } from 'ethers';
import { identitiesNFT, identitiesNFTAbi, identityAbi } from '../constants/contracts';
import { FormatTypes, Interface, parseEther } from 'ethers/lib/utils';

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

export default function AccordionErc({ provider = null, identityContractAddr }: { provider: any; identityContractAddr: string }) {
  const [expanded, setExpanded] = React.useState<string | false>('');
  const [networkState, setNetworkState] = React.useState({
    owner: '',
    mintResult: '',
    successMint: true
  });
  const [loading, setLoading] = React.useState(false)

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  const initNetworkInfo = async () => {
    try {
      const providedWeb3 = new ethers.providers.Web3Provider(provider)
      const iIdentityContractInterface = new Interface(identitiesNFTAbi)
      iIdentityContractInterface.format(FormatTypes.full)
      const signer = await providedWeb3.getSigner()
      const contract = new ethers.Contract(identitiesNFT, iIdentityContractInterface, signer)

      const ercOwner = await contract.owner()
      setNetworkState((curr) => ({
        ...curr,
        owner: ercOwner
      }))

    } catch (error: any) {
      toast.error(error.message || 'Some Error Occured!')
    }
  }

  const mint = async () => {
    try {
      setLoading(true)
      const providedWeb3 = new ethers.providers.Web3Provider(provider)
      const iIdentityContractInterface = new Interface(identityAbi)

      iIdentityContractInterface.format(FormatTypes.full)
      const signer = await providedWeb3.getSigner()
      const contract = new ethers.Contract(identityContractAddr, iIdentityContractInterface, signer)

      const mintSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("safeMint()")).substring(0, 10)
      const mint = await contract.functions.execute(0, identitiesNFT, parseEther("0.1"), mintSignatureHash, { gasLimit: 1 * 10 ** 6 })
      providedWeb3.waitForTransaction(mint.hash, 1, 1500000).then(async (data) => {
        toast.success(`Success mint [hash]: ${data.blockHash}`)
        const transaction = await providedWeb3.getTransaction(data.transactionHash)

        console.log(data, '@data?')
        console.log(transaction, '@transactionData?')

        setNetworkState((curr) => ({
          ...curr,
          mintResult: `${data.transactionHash}`,
          successMint: true
        }))
        setLoading(false)
      }).catch((err) => {
        console.log(err, '@err?')
        toast.error(err.message || 'Error')
        setNetworkState((curr) => ({
          ...curr,
          mintResult: `${err.message || 'An error occured'}`,
          successMint: false
        }))
        setLoading(false)
      })
    } catch (err: any) {
      console.log(err, '@error?')
      setLoading(false)
      setNetworkState((curr) => ({
        ...curr,
        mintResult: `${err.message || 'An error occured'}`,
        successMint: false
      }))
      toast.error(err.message || 'Some Error Occured!')
    }
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
          <Typography>{expanded === 'panel1' ? 'Hide' : 'Show'} ERC721 Contract</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container direction='column' spacing={1}>
            <Grid item>
              <Stack direction='column' spacing={0}>
                <Typography fontWeight={'bold'}>Mint</Typography>
                <Typography component={'a'} href={`https://mumbai.polygonscan.com/tx/${networkState.mintResult}`} sx={{ color: networkState.successMint ? 'blue' : 'red' }} target='_blank'>Result: {networkState.mintResult}</Typography>
                <LoadingButton variant='contained' sx={{ backgroundColor: 'blue', color: 'white', width: 100 }} onClick={mint} loading={loading}>Mint</LoadingButton>
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction='column' spacing={0}>
                <Typography fontWeight={'bold'}>Owner</Typography>
                <Typography component="a" href={`https://mumbai.polygonscan.com/address/${networkState.owner}`} target={'_blank'}>{networkState.owner}</Typography>
              </Stack>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
