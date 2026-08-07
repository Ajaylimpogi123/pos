import { Button } from "@/Components/ui/button";
import { Banknote, Smartphone, Printer, X } from "lucide-react";
import { router, usePage } from "@inertiajs/react";
export default function CheckoutModal({
    isOpen,
    onClose,
    cartItems,
    tableNumber,
    subTotal,
    discount,
    setDiscount,
    amountDue,
    paymentMethod,
    setPaymentMethod,
    payment,
    setPayment,
    change,
    onConfirm,
    isPlacingOrder,
    onPrintKitchen,
    isPrintingKitchen,
    table_id,
}) {
    if (!isOpen) return null;

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        setIsPlacingOrder(true);

        router.post(
            route("order.store", table_id),
            {
                payment_method: paymentMethod,
                od_amount_due: amountDue,
                od_discount: discount,
                od_total_amt_due: amountDue,
                od_payment: payment,
                od_change: change,
                items: cartItems.map((item) => ({
                    pd_id: item.pd_id || item.id,
                    ct_qty: item.ct_qty || 1,
                    ct_price: item.pd_price || item.ct_price,
                })),
            },
            {
                onSuccess: (page) => {
                    const order = page.props.flash?.order;
                    if (order) {
                        printReceipt(order);
                    } else {
                        console.warn(
                            "Order saved but no order data returned — check flash sharing in HandleInertiaRequests.",
                        );
                    }
                    onClose();
                },
                onError: (errors) => {
                    console.error("Order failed:", errors);
                    // errors are also available via usePage().props.errors
                    // if you want to render them inline in the modal
                },
                onFinish: () => {
                    setIsPlacingOrder(false);
                },
            },
        );
    };

    async function printReceipt(order) {
        try {
            const response = await fetch(
                "http://127.0.0.1:8080/print-agent/print-agent.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        invoice_number: order.invoice_no,
                        date: order.created_at,
                        customer_name: order.customer?.cust_fname || "Walk-in",
                        items: order.items.map((i) => ({
                            name: i.products?.pd_name ?? "Item",
                            unit: "pcs",
                            qty: i.oi_qty,
                            total: (i.oi_price * i.oi_qty).toFixed(2),
                        })),
                        total: order.od_total_amt_due,
                        payment_method: order.payment_method,
                    }),
                },
            );
            const result = await response.json();
            if (!result.success) {
                console.error("Print failed:", result.error);
            }
        } catch (err) {
            console.error(
                "Print agent unreachable — is XAMPP Apache running?",
                err,
            );
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b flex items-start justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            Checkout
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Review items and confirm payment to complete this
                            sale.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isPlacingOrder}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Item Review */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                                Order Review
                            </h4>
                            <span className="text-xs text-gray-400">
                                Table {tableNumber}
                            </span>
                        </div>
                        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                            {cartItems.map((item) => {
                                const id = item.pd_id || item.id;
                                const name = item.pd_name || item.name;
                                const price = Number(
                                    item.pd_price || item.ct_price || 0,
                                );
                                const qty = item.ct_qty || 1;
                                return (
                                    <div
                                        key={id}
                                        className="flex justify-between text-sm border-b pb-2"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {name}
                                            </p>
                                            <p className="text-gray-400">
                                                ₱{price.toFixed(2)} × {qty}
                                            </p>
                                        </div>
                                        <span className="font-semibold text-gray-900">
                                            ₱{(price * qty).toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Gross Total</span>
                            <span className="font-medium">
                                ₱{subTotal.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600">Discount</span>
                            <div className="flex items-center gap-2">
                                <span className="text-red-500">
                                    -₱{discount.toFixed(2)}
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    max={subTotal}
                                    value={discount || ""}
                                    onChange={(e) =>
                                        setDiscount(
                                            Math.min(
                                                Number(e.target.value) || 0,
                                                subTotal,
                                            ),
                                        )
                                    }
                                    className="w-20 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                                    placeholder="0"
                                    step="0.01"
                                    disabled={isPlacingOrder}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                            <span className="font-bold text-gray-900">
                                Net Total
                            </span>
                            <span className="font-bold text-green-600 text-lg">
                                ₱{amountDue.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                            Payment Method
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    setPaymentMethod("cash");
                                    setPayment(0);
                                }}
                                disabled={isPlacingOrder}
                                className={`p-3 border-2 rounded-xl ${
                                    paymentMethod === "cash"
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                <Banknote
                                    className={`w-5 h-5 mx-auto mb-1 ${
                                        paymentMethod === "cash"
                                            ? "text-green-600"
                                            : "text-gray-600"
                                    }`}
                                />
                                <span
                                    className={`text-sm font-medium ${
                                        paymentMethod === "cash"
                                            ? "text-green-700"
                                            : "text-gray-700"
                                    }`}
                                >
                                    Cash
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    setPaymentMethod("gcash");
                                    setPayment(amountDue);
                                }}
                                disabled={isPlacingOrder}
                                className={`p-3 border-2 rounded-xl ${
                                    paymentMethod === "gcash"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                <Smartphone
                                    className={`w-5 h-5 mx-auto mb-1 ${
                                        paymentMethod === "gcash"
                                            ? "text-blue-600"
                                            : "text-gray-600"
                                    }`}
                                />
                                <span
                                    className={`text-sm font-medium ${
                                        paymentMethod === "gcash"
                                            ? "text-blue-700"
                                            : "text-gray-700"
                                    }`}
                                >
                                    GCash
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Amount Received (cash only) */}
                    {paymentMethod === "cash" && (
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Amount Received
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={payment || ""}
                                onChange={(e) =>
                                    setPayment(Number(e.target.value) || 0)
                                }
                                className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="0.00"
                                step="0.01"
                                disabled={isPlacingOrder}
                            />
                            <div className="flex justify-between mt-2 text-sm">
                                <span className="text-gray-600">
                                    Change Due
                                </span>
                                <span className="font-bold">
                                    ₱{change.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onPrintKitchen}
                        disabled={
                            isPrintingKitchen ||
                            isPlacingOrder ||
                            cartItems.length === 0
                        }
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        {isPrintingKitchen
                            ? "Printing..."
                            : "Print Kitchen Ticket"}
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                        disabled={isPlacingOrder}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleConfirm}
                        disabled={
                            isPlacingOrder ||
                            cartItems.length === 0 ||
                            (paymentMethod === "cash" && payment < amountDue)
                        }
                    >
                        {isPlacingOrder ? "Processing..." : "Confirm Sale"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
