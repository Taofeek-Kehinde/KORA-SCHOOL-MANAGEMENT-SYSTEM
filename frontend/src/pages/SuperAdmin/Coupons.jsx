import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../utils/axios';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTicketAlt,
  FaPercent,
  FaCalendarAlt,
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
} from 'react-icons/fa';
import CouponModal from './components/CouponModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const Coupons = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  // Fetch coupons
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['coupons', searchTerm],
    queryFn: async () => {
      const response = await api.get('/admin/subscription/coupons');
      return response.data;
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
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

  const coupons = data?.data || [];

  const getStatusBadge = (coupon) => {
    if (!coupon.is_active) {
      return { color: 'bg-gray-100 text-gray-800', label: 'Inactive', icon: FaTimesCircle };
    }
    if (new Date(coupon.valid_until) < new Date()) {
      return { color: 'bg-red-100 text-red-800', label: 'Expired', icon: FaTimesCircle };
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Used Up', icon: FaClock };
    }
    return { color: 'bg-green-100 text-green-800', label: 'Active', icon: FaCheckCircle };
  };

  const filteredCoupons = coupons.filter(coupon => 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.schools?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Failed to Load Coupons</h3>
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Coupon Codes</h1>
          <p className="text-gray-500 mt-1">Manage discount coupons for schools</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => {
              setSelectedCoupon(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaPlus />
            Create Coupon
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
            placeholder="Search coupons by code, description, or school..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
      </div>

      {/* Coupons Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kora-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading coupons...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaTicketAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Coupons Found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No coupons match your search criteria' : 'Create your first coupon to offer discounts'}
          </p>
          <button
            onClick={() => {
              setSelectedCoupon(null);
              setShowModal(true);
            }}
            className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary"
          >
            Create Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => {
            const StatusBadge = getStatusBadge(coupon);
            const StatusIcon = StatusBadge.icon;
            
            return (
              <div key={coupon.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg text-kora-primary bg-kora-primary/10 px-3 py-1 rounded-lg">
                        {coupon.code}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${StatusBadge.color}`}>
                        <StatusIcon className="text-xs" />
                        {StatusBadge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{coupon.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => {
                        setSelectedCoupon(coupon);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => {
                        setConfirmId(coupon.id);
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
                      <span className="font-semibold text-green-600 ml-1">{coupon.discount_percentage}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Uses:</span>
                      <span className="font-semibold ml-1">{coupon.used_count || 0}/{coupon.max_uses || '∞'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <FaCalendarAlt />
                    <span>{new Date(coupon.valid_from).toLocaleDateString()}</span>
                    <span>→</span>
                    <span>{new Date(coupon.valid_until).toLocaleDateString()}</span>
                  </div>
                  {coupon.schools?.name && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <FaBuilding />
                      <span>{coupon.schools.name}</span>
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
        <CouponModal
          coupon={selectedCoupon}
          onClose={() => {
            setShowModal(false);
            setSelectedCoupon(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['coupons']);
            setShowModal(false);
            setSelectedCoupon(null);
          }}
        />
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Delete Coupon"
          message="Are you sure you want to delete this coupon? This action cannot be undone."
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

export default Coupons;