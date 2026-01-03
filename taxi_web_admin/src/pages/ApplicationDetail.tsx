import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ChevronLeft,
    CheckCircle2,
    XCircle,
    Clock,
    Download,
    AlertTriangle,
    User,
    Car,
    Calendar,
    Eye
} from 'lucide-react';

const ApplicationDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectType, setRejectType] = useState<any>(null); // { type: 'doc' | 'app', id?: number }

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/admin/applications/${id}`);
            if (res.data.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyDoc = async (docId: number, status: string, reason?: string) => {
        setProcessing(true);
        try {
            const res = await api.post(`/admin/documents/${docId}/verify`, { status, reason });
            if (res.data.success) {
                fetchDetails();
                setShowRejectModal(false);
                setRejectReason('');
            }
        } catch (error) {
            console.error('Verify error:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleApproveApp = async () => {
        setProcessing(true);
        try {
            const res = await api.post(`/admin/applications/${id}/approve`);
            if (res.data.success) {
                navigate('/applications');
            } else {
                alert(res.data.message);
            }
        } catch (error) {
            console.error('Approve error:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectApp = async (reason: string) => {
        setProcessing(true);
        try {
            const res = await api.post(`/admin/applications/${id}/reject`, { reason });
            if (res.data.success) {
                navigate('/applications');
            }
        } catch (error) {
            console.error('Reject error:', error);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-gray-400">Loading details...</div>;
    if (!data) return <div className="p-20 text-center text-red-500">Application not found</div>;

    const { application, documents } = data;
    const allVerified = documents.length > 0 && documents.every((d: any) => d.verification_status === 'verified');

    return (
        <div className="space-y-6 pb-20">
            <button
                onClick={() => navigate('/applications')}
                className="flex items-center text-gray-400 hover:text-text transition-all mb-4"
            >
                <ChevronLeft className="w-5 h-5 mr-1" /> Back to applications
            </button>

            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold mb-2">{application.full_name}</h2>
                    <div className="flex items-center space-x-3 text-sm text-gray-400">
                        <span>ID: APPLICATION-{application.id}</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <span>Submitted {new Date(application.created_at).toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={() => { setRejectType({ type: 'app' }); setShowRejectModal(true); }}
                        className="px-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all"
                    >
                        Reject Application
                    </button>
                    <button
                        onClick={handleApproveApp}
                        disabled={!allVerified || processing}
                        className={`px-8 py-3 rounded-xl font-bold transition-all ${allVerified
                            ? 'bg-primary text-black hover:bg-primary/90'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                            }`}
                    >
                        {allVerified ? 'Approve Driver' : 'Awaiting Documentation'}
                    </button>
                </div>
            </div>

            {!allVerified && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 p-4 rounded-2xl flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="text-sm font-medium">This application cannot be approved until all documents are individually verified.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Personal & Vehicle Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass p-6 rounded-3xl">
                        <h3 className="text-lg font-bold mb-6 flex items-center"><User className="w-5 h-5 mr-2 text-primary" /> Personal Details</h3>
                        <div className="space-y-4">
                            <div><p className="text-xs text-gray-500 uppercase font-black mb-1">Full Name</p><p className="font-medium">{application.full_name}</p></div>
                            <div><p className="text-xs text-gray-500 uppercase font-black mb-1">Email</p><p className="font-medium">{application.email}</p></div>
                            <div><p className="text-xs text-gray-500 uppercase font-black mb-1">Phone</p><p className="font-medium">{application.phone}</p></div>
                            <div><p className="text-xs text-gray-500 uppercase font-black mb-1">National ID</p><p className="font-medium">{application.national_id}</p></div>
                            <div><p className="text-xs text-gray-500 uppercase font-black mb-1">License No.</p><p className="font-medium text-primary">{application.drivers_license_number}</p></div>
                            <div><p className="text-xs text-gray-500 uppercase font-black mb-1">License Expiry</p><p className="font-medium flex items-center"><Calendar className="w-4 h-4 mr-2" />{new Date(application.license_expiry_date).toLocaleDateString()}</p></div>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl">
                        <h3 className="text-lg font-bold mb-6 flex items-center"><Car className="w-5 h-5 mr-2 text-primary" /> Vehicle Details</h3>
                        <div className="space-y-4">
                            <div><p className="text-xs text-gray-500 uppercase font-black mb-1">Model & Type</p><p className="font-medium">{application.vehicle_type}</p></div>
                            <div><p className="text-xs text-gray-500 uppercase font-black mb-1">Plate Number</p><p className="font-bold text-lg">{application.vehicle_registration_number}</p></div>
                            <div><p className="text-xs text-gray-500 uppercase font-black mb-1">Color</p><p className="font-medium">{application.vehicle_color}</p></div>
                            <div><p className="text-xs text-gray-500 uppercase font-black mb-1">Exp. Years</p><p className="font-medium">{application.driving_experience_years} Years</p></div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Documents */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold px-2">Document Verification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {documents.map((doc: any) => (
                            <div key={doc.id} className="glass rounded-3xl overflow-hidden flex flex-col group">
                                <div className="relative h-48 bg-black/40">
                                    <img src={doc.file_path} alt={doc.doc_type} className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center space-x-4">
                                        <a href={doc.file_path} target="_blank" className="p-3 bg-white/10 rounded-full hover:bg-white/20"><Eye className="w-5 h-5" /></a>
                                        <a href={doc.file_path} download className="p-3 bg-white/10 rounded-full hover:bg-white/20"><Download className="w-5 h-5" /></a>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold capitalize">{doc.doc_type.replace('_', ' ')}</h4>
                                            <p className="text-[10px] text-gray-400 break-all">{doc.file_path}</p>
                                        </div>
                                        {doc.verification_status === 'verified' && <span className="text-green-500 flex items-center text-xs font-bold uppercase"><CheckCircle2 className="w-4 h-4 mr-1" /> Verified</span>}
                                        {doc.verification_status === 'rejected' && <span className="text-red-500 flex items-center text-xs font-bold uppercase"><XCircle className="w-4 h-4 mr-1" /> Rejected</span>}
                                        {doc.verification_status === 'unverified' && <span className="text-primary flex items-center text-xs font-bold uppercase"><Clock className="w-4 h-4 mr-1" /> Pending</span>}
                                    </div>

                                    {doc.rejection_reason && (
                                        <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/20">
                                            <p className="text-[10px] text-red-500 uppercase font-black mb-1">Rejection Reason</p>
                                            <p className="text-xs text-gray-400">{doc.rejection_reason}</p>
                                        </div>
                                    )}

                                    <div className="flex space-x-2 pt-2">
                                        <button
                                            onClick={() => handleVerifyDoc(doc.id, 'verified')}
                                            disabled={doc.verification_status === 'verified' || processing}
                                            className="flex-1 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-xs font-bold hover:bg-green-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Verify
                                        </button>
                                        <button
                                            onClick={() => { setRejectType({ type: 'doc', id: doc.id }); setShowRejectModal(true); }}
                                            disabled={doc.verification_status === 'rejected' || processing}
                                            className="flex-1 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="glass max-w-md w-full p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold mb-2">Provide Rejection Reason</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            {rejectType.type === 'doc'
                                ? 'Explain why this specific document is being rejected.'
                                : 'Explain the reason for declining this driver application.'}
                        </p>

                        <textarea
                            className="w-full bg-surface border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mb-6"
                            rows={4}
                            placeholder="e.g. Image blurry, document expired, incorrect name..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        ></textarea>

                        <div className="flex space-x-4">
                            <button
                                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                                className="flex-1 py-3 bg-white/5 rounded-xl font-bold hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!rejectReason || processing}
                                onClick={() => {
                                    if (rejectType.type === 'doc') handleVerifyDoc(rejectType.id, 'rejected', rejectReason);
                                    else handleRejectApp(rejectReason);
                                }}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationDetail;
