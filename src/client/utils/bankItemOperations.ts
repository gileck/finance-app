import { 
  updateBankItem as updateBankItemApi, 
  deleteBankItem as deleteBankItemApi 
} from '@/apis/bankItems/client';
import { BankItem } from '@/apis/bankItems/types';

// Interface for the response object
interface OperationResponse {
  success: boolean;
  message: string;
  severity: 'success' | 'error';
  updatedItem?: BankItem;
}

/**
 * Updates a bank item
 * @param bankItem The bank item to update
 * @returns A promise that resolves to an operation response
 */
export const updateBankItem = async (bankItem: BankItem): Promise<OperationResponse> => {
  try {
    const response = await updateBankItemApi({ bankItem });
    
    if (response.data.error) {
      return {
        success: false,
        message: `Error: ${response.data.error}`,
        severity: 'error'
      };
    }
    
    return {
      success: true,
      message: 'Bank item updated successfully',
      severity: 'success',
      updatedItem: response.data.bankItem
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to update bank item: ${err instanceof Error ? err.message : String(err)}`,
      severity: 'error'
    };
  }
};

/**
 * Deletes a bank item
 * @param id The ID of the bank item to delete
 * @returns A promise that resolves to an operation response
 */
export const deleteBankItem = async (id: string): Promise<OperationResponse> => {
  try {
    const response = await deleteBankItemApi({ id });
    
    if (response.data.error) {
      return {
        success: false,
        message: `Error: ${response.data.error}`,
        severity: 'error'
      };
    }
    
    return {
      success: true,
      message: 'Bank item deleted successfully',
      severity: 'success'
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to delete bank item: ${err instanceof Error ? err.message : String(err)}`,
      severity: 'error'
    };
  }
};
