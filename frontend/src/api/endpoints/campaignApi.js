import axiosClient from '../axiosClient';

export const campaignApi = {
  // Live campaigns across every connected ad account (each tagged with its
  // connectionId + adAccountName).
  list: () => axiosClient.get('/social/campaigns'),
  // Pull this campaign's Instant-Form submissions into the unified Lead
  // system, using the given connection's token.
  syncLeads: (campaignId, connectionId) =>
    axiosClient.post(`/social/campaigns/${campaignId}/sync-leads`, { connectionId }),

  // Browse tree (live from Meta): a campaign's ad sets, and an ad set's ads.
  adSets: (campaignId, connectionId) =>
    axiosClient.get(`/social/campaigns/${campaignId}/adsets`, { params: { connectionId } }),
  ads: (adsetId, connectionId) =>
    axiosClient.get(`/social/campaigns/adsets/${adsetId}/ads`, { params: { connectionId } }),
};
