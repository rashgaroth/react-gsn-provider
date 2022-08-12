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

interface INetworkState {
  account: string
  chainId: number
  balance: string
}

export default function AccordionInfo({ provider = null }: { provider: any }) {
  const [expanded, setExpanded] = React.useState<string | false>('');
  const [networkState, setNetworkState] = React.useState<INetworkState>({
    account: '',
    chainId: 0,
    balance: ''
  });

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  const initNetworkInfo = async () => {
    try {
      const web3 = new Web3(provider)
      const _account = await web3.eth.getAccounts()
      const _chainId = await web3.eth.getChainId()
      const _balance = await web3.eth.getBalance(_account[0])

      setNetworkState((curr) => ({
        ...curr,
        account: _account[0],
        balance: toSmallUnit(parseInt(_balance), 18).toString() + ' Mumbai',
        chainId: _chainId
      }))

    } catch (error: any) {
      toast.error(error.message || 'Some Error Occured!')
    }
  }

  React.useEffect(() => {
    if (provider !== null) {
      initNetworkInfo()
    }
  }, [provider])

  return (
    <div>
      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')} sx={{ borderRadius: 4 }}>
        <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
          <Typography>{expanded === 'panel1' ? 'Hide' : 'Show'} Network info</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container direction='column' spacing={1}>
            <Grid item>
              <Stack direction='row' spacing={2} sx={{ p:2, bgcolor: 'gray', borderRadius: 2, color: 'white' }}>
                <code>(i) Account</code>
                <code>{networkState.account}</code>
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction='row' spacing={2} sx={{ p:2, bgcolor: 'gray', borderRadius: 2, color: 'white' }}>
                <code>(i) ChainID</code>
                <code>{networkState.chainId}</code>
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction='row' spacing={2} sx={{ p:2, bgcolor: 'gray', borderRadius: 2, color: 'white' }}>
                <code>(i) Balance</code>
                <code>{networkState.balance}</code>
              </Stack>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
