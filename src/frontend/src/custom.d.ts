declare module '*.png';
declare module '*.jpg';
declare module '*.svg';

interface RazorpayResponse {
	razorpay_payment_id: string;
	razorpay_order_id: string;
	razorpay_signature: string;
}

interface Window {
	Razorpay: any;
}
