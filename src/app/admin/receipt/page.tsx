
'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const generateReceiptId = () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const random = Date.now().toString().slice(-6);
    return `REA-Y${year}M${month}-${random}`;
};

const getInitialReceiptState = () => ({
    receiptId: generateReceiptId(),
    buyerName: '',
    buyerAddress: '',
    buyerPhone: '',
    bikeModel: '',
    exShowroomPrice: 0,
    rtoPrice: 0,
    insurancePrice: 0,
    totalPrice: 0,
    paymentMode: 'Cash',
    transactionId: '',
    additionalDetails: [] as { key: string, value: string }[],
});

const ReceiptPage = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [receiptData, setReceiptData] = useState(getInitialReceiptState());

    useEffect(() => {
        const fetchProducts = async () => {
            const productsQuery = query(collection(db, "products"), orderBy("createdAt"));
            const productsSnapshot = await getDocs(productsQuery);
            setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchProducts();
    }, []);

    const resetForm = () => {
        setReceiptData(getInitialReceiptState());
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setReceiptData(prev => ({ ...prev, [name]: value }));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const price = Number(value);
        setReceiptData(prev => {
            const newPrices = { ...prev, [name]: price };
            const totalPrice = newPrices.exShowroomPrice + newPrices.rtoPrice + newPrices.insurancePrice;
            return { ...newPrices, totalPrice };
        });
    };

    const handleAdditionalDetailChange = (index: number, field: 'key' | 'value', value: string) => {
        const newDetails = [...receiptData.additionalDetails];
        newDetails[index][field] = value;
        setReceiptData(prev => ({ ...prev, additionalDetails: newDetails }));
    };

    const addAdditionalDetail = () => {
        setReceiptData(prev => ({ ...prev, additionalDetails: [...prev.additionalDetails, { key: '', value: '' }] }));
    };

    const downloadPdf = () => {
        const receiptElement = document.getElementById('receipt-preview');
        if (receiptElement) {
            html2canvas(receiptElement, { scale: 2 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const canvasWidth = canvas.width;
                const ratio = canvasWidth / pdf.internal.pageSize.getHeight();
                const width = pdfWidth - 20;
                const height = width / ratio;
                pdf.addImage(imgData, 'PNG', 10, 10, width, height);
                pdf.save(`receipt-${receiptData.receiptId}.pdf`);
            });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSubmit = async () => {
        if (!receiptData.buyerName || !receiptData.bikeModel || receiptData.totalPrice <= 0) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            await addDoc(collection(db, 'receipts'), {
                ...receiptData,
                createdAt: serverTimestamp(),
            });
            alert(`Receipt saved successfully!\nReceipt ID: ${receiptData.receiptId}`);
            downloadPdf();
        } catch (error) {
            console.error("Error saving receipt: ", error);
            alert('Failed to save receipt. Please check the Firestore rules and ensure you are authenticated as an admin.');
        }
    };

    return (
        <div className="printable-area">
            <div className="receipt-layout-grid">
                <div className="receipt-form-container non-printable glass-card">
                    <h2 className="text-xl font-semibold mb-4">Buyer & Bike Details</h2>
                    <div className="form-group">
                        <label>Buyer Name</label>
                        <input type="text" name="buyerName" value={receiptData.buyerName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Buyer Address</label>
                        <input type="text" name="buyerAddress" value={receiptData.buyerAddress} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Buyer Phone</label>
                        <input type="text" name="buyerPhone" value={receiptData.buyerPhone} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Bike Model</label>
                        <select name="bikeModel" value={receiptData.bikeModel} onChange={handleInputChange}>
                            <option value="" disabled>Select a model</option>
                            {products.map(p => <option key={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <h2 className="text-xl font-semibold mt-6 mb-4">Price Breakdown</h2>
                    <div className="form-group">
                        <label>Ex-Showroom Price</label>
                        <input type="number" name="exShowroomPrice" value={receiptData.exShowroomPrice} onChange={handlePriceChange} />
                    </div>
                    <div className="form-group">
                        <label>RTO</label>
                        <input type="number" name="rtoPrice" value={receiptData.rtoPrice} onChange={handlePriceChange} />
                    </div>
                    <div className="form-group">
                        <label>Insurance</label>
                        <input type="number" name="insurancePrice" value={receiptData.insurancePrice} onChange={handlePriceChange} />
                    </div>

                    <h2 className="text-xl font-semibold mt-6 mb-4">Payment</h2>
                    <div className="form-group">
                        <label>Payment Mode</label>
                        <select name="paymentMode" value={receiptData.paymentMode} onChange={handleInputChange}>
                            <option>Cash</option>
                            <option>Card</option>
                            <option>Online</option>
                            <option>Finance</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Transaction ID / Cheque No.</label>
                        <input type="text" name="transactionId" value={receiptData.transactionId} onChange={handleInputChange} />
                    </div>

                    <h2 className="text-xl font-semibold mt-6 mb-4">Additional Details</h2>
                    {receiptData.additionalDetails.map((detail, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                            <input type="text" placeholder="Field Name" value={detail.key} onChange={e => handleAdditionalDetailChange(index, 'key', e.target.value)} />
                            <input type="text" placeholder="Value" value={detail.value} onChange={e => handleAdditionalDetailChange(index, 'value', e.target.value)} />
                        </div>
                    ))}
                    <button onClick={addAdditionalDetail} className="btn-outline mt-2"><i className="fa-solid fa-plus"></i> Add Detail</button>
                </div>

                <div id="receipt-preview" className="receipt-preview-paper">
                    <h2 className="text-2xl font-bold text-center mb-4" style={{ fontFamily: 'var(--font-heading)', color: '#121212', letterSpacing: '0.05em' }}>INVOICE</h2>
                    <div className="receipt-preview-header">
                        <div>
                            <p style={{ margin: 0 }}><strong>Funshine Getaways Pvt Ltd</strong></p>
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>Authorized Royal Enfield Dealership</p>
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>AT Rd, near ASTC Bus Stand, Sivasagar</p>
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>Phone: +91 86387 07085</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Invoice No:</strong> {receiptData.receiptId}</p>
                        </div>
                    </div>
                    <hr style={{ margin: '16px 0', border: 0, borderTop: '1px solid #e2e8f0' }} />
                    <div className="mb-4">
                        <h3 className="font-semibold" style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Billed To:</h3>
                        <p style={{ margin: 0 }}>{receiptData.buyerName || 'Customer Name'}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>{receiptData.buyerAddress || 'Address details'}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>{receiptData.buyerPhone || 'Phone number'}</p>
                    </div>
                    <table className="receipt-details-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Ex-Showroom Price ({receiptData.bikeModel || 'Selected Model'})</td><td className="text-right">&#8377; {receiptData.exShowroomPrice.toLocaleString()}</td></tr>
                            <tr><td>RTO Registration & Road Tax</td><td className="text-right">&#8377; {receiptData.rtoPrice.toLocaleString()}</td></tr>
                            <tr><td>Comprehensive Insurance</td><td className="text-right">&#8377; {receiptData.insurancePrice.toLocaleString()}</td></tr>
                            {receiptData.additionalDetails.map((detail, index) => (
                                <tr key={index}><td>{detail.key || 'Additional Charge'}</td><td className="text-right">&#8377; {Number(detail.value || 0).toLocaleString()}</td></tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="total-row"><td>Total Amount Paid</td><td className="text-right">&#8377; {receiptData.totalPrice.toLocaleString()}</td></tr>
                        </tfoot>
                    </table>
                    <div className="mt-6" style={{ fontSize: '0.9rem' }}>
                        <p style={{ margin: 0 }}><strong>Payment Mode:</strong> {receiptData.paymentMode}</p>
                        {receiptData.transactionId && <p style={{ margin: 0 }}><strong>Transaction / Auth ID:</strong> {receiptData.transactionId}</p>}
                    </div>
                    <div className="mt-8 text-center text-xs" style={{ fontSize: '0.75rem', color: '#718096' }}>
                        <p style={{ margin: 0 }}>This is a computer-generated receipt and does not require a signature.</p>
                        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Funshine Getaways. All rights reserved.</p>
                    </div>
                </div>
            </div>

            <div className="receipt-actions non-printable">
                <button onClick={resetForm} className="btn-outline"><i className="fa-solid fa-plus"></i> Reset Form</button>
                <button onClick={handlePrint} className="btn-outline"><i className="fa-solid fa-print"></i> Print Invoice</button>
                <button onClick={handleSubmit} className="btn-primary"><i className="fa-solid fa-download"></i> Save & Download PDF</button>
            </div>
        </div>
    );
};

export default ReceiptPage;
