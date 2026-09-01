import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../utils/axios';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBullhorn,
  FaPercent,
  FaCalendarAlt,
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaUsers,
} from 'react-icons/fa';
import PromoCampaignModal from './components/PromoCampaignModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const PromoCampaigns = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  // Fetch campaigns
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['promoCampaigns'],
    queryFn: async () => {
      const response = await api.get('/admin/subscription/promo-campaigns');
      return response.data;
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (campaignId) => {
      const response = await api.delete(`/admin/subscription/promo-campaigns/${campaignId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campaign deleted successfully');
      queryClient.invalidateQueries(['promoCampaigns']);
      setShowConfirm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete campaign');
    }
  });

  const campaigns = data?.data || [];

  const getStatusBadge = (campaign) => {
    if (!campaign.is_active) {
      return { color: 'bg-gray-100 text-gray-800', label: 'Inactive', icon: FaTimesCircle };
    }
    if (new Date(campaign.valid_until) < new Date()) {
      return { color: 'bg-red-100 text-red-800', label: 'Expired', icon: FaTimesCircle };
    }
    if (campaign.max_schools && campaign.used_count >= campaign.max_schools) {
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Fully Used', icon: FaClock };
    }
    return { color: 'bg-green-100 text-green-800', label: 'Active', icon: FaCheckCircle };
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Failed to Load Campaigns</h3>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Promo Campaigns</h1>
          <p className="text-gray-500 mt-1">Manage promotional campaigns for schools</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => {
              setSelectedCampaign(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaPlus />
            Create Campaign
          </button>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <FaSearch />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kora-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading campaigns...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaBullhorn className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Campaigns Found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No campaigns match your search criteria' : 'Create your first promo campaign'}
          </p>
          <button
            onClick={() => {
              setSelectedCampaign(null);
              setShowModal(true);
            }}
            className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCampaigns.map((campaign) => {
            const StatusBadge = getStatusBadge(campaign);
            const StatusIcon = StatusBadge.icon;
            
            return (
              <div key={campaign.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg text-gray-800">{campaign.name}</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${StatusBadge.color}`}>
                        <StatusIcon className="text-xs" />
                        {StatusBadge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{campaign.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => {
                        setConfirmId(campaign.id);
                        setShowConfirm(true);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Discount:</span>
                      <span className="font-semibold text-green-600 ml-1">{campaign.discount_percentage}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Schools:</span>
                      <span className="font-semibold ml-1">{campaign.used_count || 0}/{campaign.max_schools || '∞'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <FaCalendarAlt />
                    <span>{new Date(campaign.valid_from).toLocaleDateString()}</span>
                    <span>→</span>
                    <span>{new Date(campaign.valid_until).toLocaleDateString()}</span>
                  </div>
                  {campaign.target_school_types && campaign.target_school_types.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {campaign.target_school_types.map((type) => (
                        <span key={type} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PromoCampaignModal
          campaign={selectedCampaign}
          onClose={() => {
            setShowModal(false);
            setSelectedCampaign(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['promoCampaigns']);
            setShowModal(false);
            setSelectedCampaign(null);
          }}
        />
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Delete Campaign"
          message="Are you sure you want to delete this campaign? This action cannot be undone."
          type="danger"
          onConfirm={() => {
            deleteMutation.mutate(confirmId);
          }}
          onCancel={() => {
            setShowConfirm(false);
            setConfirmId(null);
          }}
          isLoading={deleteMutation.isLoading}
        />
      )}
    </div>
  );
};

export default PromoCampaigns;