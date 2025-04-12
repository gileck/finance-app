import { 
  updateCardItem as updateCardItemApi, 
  deleteCardItem as deleteCardItemApi 
} from '@/apis/cardItems/client';
import { CardItem } from '@/apis/cardItems/types';

// Interface for the response object
interface OperationResponse {
  success: boolean;
  message: string;
  severity: 'success' | 'error';
  updatedItem?: CardItem;
}

/**
 * Updates a card item
 * @param cardItem The card item to update
 * @returns A promise that resolves to an operation response
 */
export const updateCardItem = async (cardItem: CardItem): Promise<OperationResponse> => {
  try {
    const response = await updateCardItemApi({ cardItem });
    
    if (response.data.error) {
      return {
        success: false,
        message: `Error: ${response.data.error}`,
        severity: 'error'
      };
    }
    
    return {
      success: true,
      message: 'Card item updated successfully',
      severity: 'success',
      updatedItem: response.data.cardItem
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to update card item: ${err instanceof Error ? err.message : String(err)}`,
      severity: 'error'
    };
  }
};

/**
 * Deletes a card item
 * @param id The ID of the card item to delete
 * @returns A promise that resolves to an operation response
 */
export const deleteCardItem = async (id: string): Promise<OperationResponse> => {
  try {
    const response = await deleteCardItemApi({ id });
    
    if (response.data.error) {
      return {
        success: false,
        message: `Error: ${response.data.error}`,
        severity: 'error'
      };
    }
    
    return {
      success: true,
      message: 'Card item deleted successfully',
      severity: 'success'
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to delete card item: ${err instanceof Error ? err.message : String(err)}`,
      severity: 'error'
    };
  }
};
