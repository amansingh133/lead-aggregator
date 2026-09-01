import { createAsyncThunk } from '@reduxjs/toolkit';
import { createListSlice } from '../../app/createListSlice';
import { campaignApi } from '../../api/endpoints/campaignApi';
import { parseApiError } from '../../utils/errorMessage';

// Live Facebook Lead Ads campaigns across every connected ad account (not
// persisted anywhere - fetched fresh from Meta on demand). Each item is
// tagged with its connectionId + adAccountName.
const { slice, fetchItems: fetchCampaigns } = createListSlice({
  name: 'campaigns',
  fetchList: async () => {
    const res = await campaignApi.list();
    return { items: res.data, meta: null };
  },
});

export const syncCampaignLeads = createAsyncThunk(
  'campaigns/syncLeads',
  async ({ campaignId, connectionId }, { rejectWithValue }) => {
    try {
      const res = await campaignApi.syncLeads(campaignId, connectionId);
      return res.data; // { scanned, created }
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

export { fetchCampaigns };
export default slice.reducer;
