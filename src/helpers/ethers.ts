import { ethers } from "ethers"
import { FormatTypes, Interface } from "ethers/lib/utils"
import { identityAbi } from "../constants/contracts"

interface IClaimData {
  identifier: string
  from: string
  to: string
  data: string
}

const signMessage = async (identityContractAddr: string, provider: any, setLoading: (loading:boolean) => void): Promise<string> => {
  try {
    setLoading(true)
    const providedWeb3 = new ethers.providers.Web3Provider(provider)
    const iIdentityContractInterface = new Interface(identityAbi)
    iIdentityContractInterface.format(FormatTypes.full)
    
    const signer = await providedWeb3.getSigner()
    const address = await signer.getAddress()

    const claimData = {
      identifier: "nft_mint_allowed",
      from: address,
      to: identityContractAddr,
      data: ethers.utils.formatBytes32String(""),
    };
    const claimDataHash = ethers.utils.solidityKeccak256(
      ["string", "address", "address", "bytes"], 
      [claimData.identifier, claimData.from, claimData.to, claimData.data]
    )

    console.log(claimDataHash, '@claimHash?')
    setLoading(false)
    return claimDataHash
  } catch (error: any) {
    setLoading(false)
    return error
  }
}

const addClaimData = async (claimDataHash: string, provider: any, identityContractAddr: string, claimData: IClaimData) => {
  const providedWeb3 = new ethers.providers.Web3Provider(provider)
  const iIdentityContractInterface = new Interface(identityAbi)
  iIdentityContractInterface.format(FormatTypes.full)
  
  const signer = await providedWeb3.getSigner()
  const contract = new ethers.Contract(identityContractAddr, iIdentityContractInterface, signer)
  await contract.addClaim({ ...claimData, signature: claimDataHash })

  return true
}

export {
  signMessage,
  addClaimData
}