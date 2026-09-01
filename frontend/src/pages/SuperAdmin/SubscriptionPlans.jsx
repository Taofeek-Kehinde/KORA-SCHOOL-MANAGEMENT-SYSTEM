import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../utils/axios';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaMoneyBillWave,
  FaClock,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaPercent,
  FaTicketAlt,
  FaBullhorn,
} from 'react-icons/fa';

import SubscriptionPlanModal from './components/SubscriptionPlanModal';
import CouponModal from './components/CouponModal';
import PromoCampaignModal from './components/PromoCampaignModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const SubscriptionPlans = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('plans');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  // Fetch subscription plans
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await api.get('/admin/subscription/plans');
      return response.data;
    }
  });

  // Fetch coupons
  const { data: couponsData, isLoading: couponsLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const response = await api.get('/admin/subscription/coupons');
      return response.data;
    }
  });

  // Fetch promo campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['promoCampaigns'],
    queryFn: async () => {
      const response = await api.get('/admin/subscription/promo-campaigns');
      return response.data;
    }
  });

  // Mutations
  const deletePlanMutation = useMutation({
    mutationFn: async (planId) => {
      const response = await api.delete(`/admin/subscription/plans/${planId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Plan deleted successfully');
      queryClient.invalidateQueries(['subscriptionPlans']);
      setShowConfirm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId) => {
      const response = await api.delete(`/admin/subscription/coupons/${couponId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Coupon deleted successfully');
      queryClient.invalidateQueries(['coupons']);
      setShowConfirm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete coupon');
    }
  });

  const deleteCampaignMutation = useMutation({
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

  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleConfirmDelete = (type, id) => {
    setConfirmAction(type);
    setConfirmId(id);
    setShowConfirm(true);
  };

  const handleDelete = () => {
    if (confirmAction === 'plan') {
      deletePlanMutation.mutate(confirmId);
    } else if (confirmAction === 'coupon') {
      deleteCouponMutation.mutate(confirmId);
    } else if (confirmAction === 'campaign') {
      deleteCampaignMutation.mutate(confirmId);
    }
  };

  const plans = plansData?.data || [];
  const coupons = couponsData?.data || [];
  const campaigns = campaignsData?.data || [];

  const tabs = [
    { id: 'plans', label: 'Subscription Plans', icon: FaMoneyBillWave, count: plans.length },
    { id: 'coupons', label: 'Coupons', icon: FaTicketAlt, count: coupons.length },
    { id: 'campaigns', label: 'Promo Campaigns', icon: FaBullhorn, count: campaigns.length },
  ];

  const getFrequencyLabel = (frequency) => {
    const map = {
      monthly: 'Monthly',
      termly: 'Termly',
      annually: 'Annually'
    };
    return map[frequency] || frequency;
  };

  const getStatusBadge = (isActive, validUntil) => {
    if (!isActive) {
      return { color: 'bg-gray-100 text-gray-800', label: 'Inactive' };
    }
    if (validUntil && new Date(validUntil) < new Date()) {
      return { color: 'bg-red-100 text-red-800', label: 'Expired' };
    }
    return { color: 'bg-green-100 text-green-800', label: 'Active' };
  };

  const renderPlansTab = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Subscription Plans</h3>
        <button
          onClick={() => handleOpenModal('plan')}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          <FaPlus />
          Add Plan
        </button>
      </div>
      {plansLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No subscription plans found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{plan.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal('plan', plan)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleConfirmDelete('plan', plan.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <FaMoneyBillWave className="text-kora-primary" />
                  <span className="font-semibold">₦{plan.price_per_student}</span>
                  <span className="text-gray-500">/student</span>
                  <span className="text-gray-400">•</span>
                  <FaClock className="text-gray-400" />
                  <span className="text-gray-600">{getFrequencyLabel(plan.billing_frequency)}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>Trial: {plan.free_trial_days} days</span>
                  <span>Grace: {plan.grace_period_days} days</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(plan.is_active).color}`}>
                    {getStatusBadge(plan.is_active).label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCouponsTab = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Coupons</h3>
        <button
          onClick={() => handleOpenModal('coupon')}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          <FaPlus />
          Add Coupon
        </button>
      </div>
      {couponsLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No coupons found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-kora-primary bg-kora-primary/10 px-3 py-1 rounded-lg">
                      {coupon.code}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(coupon.is_active, coupon.valid_until).color}`}>
                      {getStatusBadge(coupon.is_active, coupon.valid_until).label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{coupon.description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal('coupon', coupon)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleConfirmDelete('coupon', coupon.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Discount:</span>
                    <span className="font-semibold text-green-600 ml-1">{coupon.discount_percentage}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Uses:</span>
                    <span className="font-semibold ml-1">{coupon.used_count || 0}/{coupon.max_uses || '∞'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  <span>Valid: {new Date(coupon.valid_from).toLocaleDateString()}</span>
                  <span>→</span>
                  <span>{new Date(coupon.valid_until).toLocaleDateString()}</span>
                </div>
                {coupon.schools?.name && (
                  <div className="text-xs text-gray-500 mt-1">
                    School: {coupon.schools.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCampaignsTab = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Promo Campaigns</h3>
        <button
          onClick={() => handleOpenModal('campaign')}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          <FaPlus />
          Add Campaign
        </button>
      </div>
      {campaignsLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No promo campaigns found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{campaign.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal('campaign', campaign)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleConfirmDelete('campaign', campaign.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Discount:</span>
                    <span className="font-semibold text-green-600 ml-1">{campaign.discount_percentage}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Schools:</span>
                    <span className="font-semibold ml-1">{campaign.used_count || 0}/{campaign.max_schools || '∞'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  <span>Valid: {new Date(campaign.valid_from).toLocaleDateString()}</span>
                  <span>→</span>
                  <span>{new Date(campaign.valid_until).toLocaleDateString()}</span>
                </div>
                {campaign.target_school_types && campaign.target_school_types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {campaign.target_school_types.map((type) => (
                      <span key={type} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {type.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(campaign.is_active, campaign.valid_until).color}`}>
                    {getStatusBadge(campaign.is_active, campaign.valid_until).label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Subscription Management</h1>
        <p className="text-gray-500 mt-1">Manage subscription plans, coupons, and promo campaigns</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-kora-primary text-kora-primary font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon />
                  {tab.label}
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-kora-primary/10 text-kora-primary' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'plans' && renderPlansTab()}
          {activeTab === 'coupons' && renderCouponsTab()}
          {activeTab === 'campaigns' && renderCampaignsTab()}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <>
          {modalType === 'plan' && (
            <SubscriptionPlanModal
              plan={selectedItem}
              onClose={() => setShowModal(false)}
              onSuccess={() => {
                queryClient.invalidateQueries(['subscriptionPlans']);
                setShowModal(false);
              }}
            />
          )}
          {modalType === 'coupon' && (
            <CouponModal
              coupon={selectedItem}
              onClose={() => setShowModal(false)}
              onSuccess={() => {
                queryClient.invalidateQueries(['coupons']);
                setShowModal(false);
              }}
            />
          )}
          {modalType === 'campaign' && (
            <PromoCampaignModal
              campaign={selectedItem}
              onClose={() => setShowModal(false)}
              onSuccess={() => {
                queryClient.invalidateQueries(['promoCampaigns']);
                setShowModal(false);
              }}
            />
          )}
        </>
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          isLoading={deletePlanMutation.isLoading || deleteCouponMutation.isLoading || deleteCampaignMutation.isLoading}
        />
      )}
    </div>
  );
};

export default SubscriptionPlans;