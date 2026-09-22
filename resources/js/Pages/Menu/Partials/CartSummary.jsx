import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Plus, Minus, X, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import CheckoutModal from "./CheckoutModal";

export default function CartSummary({ products = [] }) {
    const { props } = usePage();
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [cartItems, setCartItems] = useState(products);
    const [loadingItem, setLoadingItem] = useState(null);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastOrder, setLastOrder] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [payment, setPayment] = useState(0);
    const [hasAutoPrinted, setHasAutoPrinted] = useState(false);
    const [referenceNo, setReferenceNo] = useState("");
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [isPrintingKitchen, setIsPrintingKitchen] = useState(false);

    // Update local state when props change
    useEffect(() => {
        setCartItems(products);
    }, [products]);

    // Check for order data in props
    useEffect(() => {
        if (props.flash?.order) {
            setLastOrder(props.flash.order);
            setShowSuccessModal(true);

            // Auto-print after a short delay
            if (!hasAutoPrinted && props.flash.order.od_id) {
                setTimeout(() => {
                    window.open(
                        route("order.print", props.flash.order.od_id),
                        "_blank",
                    );
                    setHasAutoPrinted(true);
                }, 500);
            }
        }
    }, [props.flash]);

    const subTotal = cartItems.reduce(
        (sum, product) =>
            sum + Number(product.pd_price || product.ct_price) * product.ct_qty,
        0,
    );

    const amountDue = Math.max(subTotal - discount, 0);
    const change = Math.max(payment - amountDue, 0);

    const itemCount = cartItems.reduce(
        (sum, product) => sum + product.ct_qty,
        0,
    );

    // When the checkout modal opens, default the tendered amount to the
    // amount due — mirrors GCash's behavior, so "Confirm Sale" works
    // immediately unless the cashier changes it (e.g. customer pays more,
    // expecting change).
    useEffect(() => {
        if (checkoutOpen && paymentMethod === "cash") {
            setPayment(amountDue);
        }
    }, [checkoutOpen]);

    const removeItem = (productId) => {
        const cartItem = cartItems.find(
            (item) => (item.pd_id || item.id) === productId,
        );

        if (!cartItem || !cartItem.ct_id) {
            toast.error("Cart item not found");
            return;
        }

        setLoadingItem(productId);

        router.delete(route("cart.destroy", { cart: cartItem.ct_id }), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success("Item removed from cart");
            },
            onError: () => {
                toast.error("Failed to remove item");
            },
            onFinish: () => {
                setLoadingItem(null);
            },
        });
    };

    const updateQuantity = (productId, change) => {
        const cartItem = cartItems.find(
            (item) => (item.pd_id || item.id) === productId,
        );

        if (!cartItem || !cartItem.ct_id) {
            toast.error("Cart item not found");
            return;
        }

        const newQuantity = Math.max(1, (cartItem.ct_qty || 1) + change);

        setLoadingItem(productId);

        router.patch(
            route("cart.update", { cart: cartItem.ct_id }),
            { ct_qty: newQuantity },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success("Quantity updated");
                },
                onError: () => {
                    toast.error("Failed to update quantity");
                },
                onFinish: () => {
                    setLoadingItem(null);
                },
            },
        );
    };

    const handlePlaceOrder = () => {
        if (cartItems.length === 0) {
            toast.error("Your cart is empty");
            return;
        }

        if (!paymentMethod) {
            toast.error("Please select a payment method");
            return;
        }

        if (paymentMethod === "cash" && payment < amountDue) {
            toast.error("Payment amount is less than total amount due");
            return;
        }

        if (paymentMethod === "gcash" && !referenceNo.trim()) {
            toast.error("Please enter the GCash reference number");
            return;
        }

        setIsPlacingOrder(true);
        setHasAutoPrinted(false);

        const orderData = {
            payment_method: paymentMethod,
            reference_no: paymentMethod === "gcash" ? referenceNo.trim() : null,
            od_amount_due: subTotal,
            od_discount: discount,
            od_total_amt_due: amountDue,
            od_payment: payment,
            od_change: change,
            items: cartItems.map((item) => ({
                pd_id: item.pd_id || item.id,
                ct_qty: item.ct_qty,
                ct_price: Number(item.ct_price || item.pd_price),
            })),
        };

        router.post(route("order.place"), orderData, {
            preserveScroll: true,
            preserveState: false,
            onSuccess: (page) => {
                const flash = page.props.flash;
                setIsPlacingOrder(false);

                if (flash?.error) {
                    toast.error(flash.error, { duration: 6000 });
                    return;
                }

                setCheckoutOpen(false);
                setReferenceNo("");
                toast.success(flash?.success || "Order placed successfully!");
            },
            onError: (errors) => {
                setIsPlacingOrder(false);
                const errorMessage =
                    Object.values(errors)[0] || "Failed to place order";
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsPlacingOrder(false);
            },
        });
    };

    const handlePrintKitchen = () => {
        setIsPrintingKitchen(true);

        router.post(
            route("order.printKitchen"),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const flash = page.props.flash;
                    if (flash?.error) {
                        toast.error(flash.error, { duration: 6000 });
                    } else if (flash?.success) {
                        toast.success(flash.success);
                    }

                    if (flash?.print_jobs?.length) {
                        pollPrintJobs(flash.print_jobs);
                    }
                },
                onError: (errors) => {
                    const msg =
                        Object.values(errors)[0] ||
                        "Failed to print kitchen ticket";
                    toast.error(msg);
                },
                onFinish: () => setIsPrintingKitchen(false),
            },
        );
    };

    // Polls the print-jobs status endpoint for queued kitchen tickets
    // (PRINTER_MODE=queue, e.g. the VPS deployment) every ~2s, showing a
    // toast per job as it moves through queued -> printing -> printed/failed.
    // Stops once every job has reached a terminal state or after ~30s.
    const pollPrintJobs = (jobIds) => {
        const toastId = `print-jobs-${jobIds.join("-")}`;
        const startedAt = Date.now();
        const seenTerminal = new Set();

        toast.loading("Sending kitchen ticket to printer...", {
            id: toastId,
        });

        const interval = setInterval(() => {
            const timedOut = Date.now() - startedAt > 30000;

            fetch(`${route("print-jobs.status")}?ids=${jobIds.join(",")}`, {
                headers: { Accept: "application/json" },
            })
                .then((res) => res.json())
                .then((jobs) => {
                    const allTerminal = jobs.every(
                        (job) =>
                            job.pj_status === "success" ||
                            job.pj_status === "failed",
                    );
                    const anyFailed = jobs.some(
                        (job) => job.pj_status === "failed",
                    );

                    jobs.forEach((job) => {
                        if (
                            (job.pj_status === "success" ||
                                job.pj_status === "failed") &&
                            !seenTerminal.has(job.pj_id)
                        ) {
                            seenTerminal.add(job.pj_id);
                        }
                    });

                    if (allTerminal || timedOut) {
                        clearInterval(interval);

                        if (anyFailed) {
                            const failedJob = jobs.find(
                                (job) => job.pj_status === "failed",
                            );
                            toast.error(
                                failedJob?.pj_error ||
                                    "Kitchen ticket failed to print.",
                                {
                                    id: toastId,
                                    action: {
                                        label: "Retry",
                                        onClick: () =>
                                            router.post(
                                                route(
                                                    "print-jobs.retry",
                                                    failedJob.pj_id,
                                                ),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        toast.success(
                                                            "Retry queued.",
                                                        ),
                                                },
                                            ),
                                    },
                                },
                            );
                        } else if (timedOut) {
                            toast.message(
                                "Still printing — check the printer status page if this persists.",
                                { id: toastId },
                            );
                        } else {
                            toast.success("Kitchen ticket printed.", {
                                id: toastId,
                            });
                        }
                    } else {
                        toast.loading("Printing kitchen ticket...", {
                            id: toastId,
                        });
                    }
                })
                .catch(() => {
                    // Transient network hiccup — let the interval retry on
                    // the next tick rather than surfacing an error toast.
                });
        }, 2000);
    };

    const handlePrintReceipt = () => {
        if (lastOrder && lastOrder.od_id) {
            window.open(route("order.print", lastOrder.od_id), "_blank");
        } else {
            toast.error("No order to print");
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        setLastOrder(null);
    };

    return (
        <>
            <CheckoutModal
                isOpen={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                cartItems={cartItems}
                subTotal={subTotal}
                discount={discount}
                setDiscount={setDiscount}
                amountDue={amountDue}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                payment={payment}
                setPayment={setPayment}
                change={change}
                referenceNo={referenceNo}
                setReferenceNo={setReferenceNo}
                onConfirm={handlePlaceOrder}
                isPlacingOrder={isPlacingOrder}
                onPrintKitchen={handlePrintKitchen}
                isPrintingKitchen={isPrintingKitchen}
            />

            {/* Success Modal */}
            {showSuccessModal && lastOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="inline-flex p-3 bg-green-100 rounded-full mb-4">
                                <svg
                                    className="w-12 h-12 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Order Placed Successfully!
                            </h3>
                            <p className="text-gray-500">
                                Invoice #{lastOrder.invoice_no || "N/A"}
                            </p>
                            <p className="text-xs text-blue-500 mt-2">
                                {hasAutoPrinted
                                    ? "Receipt printed"
                                    : "Receipt is printing automatically..."}
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Order #:</span>
                                <span className="font-bold">
                                    {lastOrder.queue_no}
                                </span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Payment:</span>
                                <span className="font-bold capitalize">
                                    {lastOrder.payment_method || paymentMethod}
                                </span>
                            </div>
                            {(lastOrder.payment_method === "gcash" ||
                                paymentMethod === "gcash") &&
                                lastOrder.reference_no && (
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-600">
                                            Reference #:
                                        </span>
                                        <span className="font-bold">
                                            {lastOrder.reference_no}
                                        </span>
                                    </div>
                                )}
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Items:</span>
                                <span className="font-bold">
                                    {lastOrder.items?.length || itemCount} items
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="font-medium">Total:</span>
                                <span className="text-xl font-bold text-green-600">
                                    ₱
                                    {parseFloat(
                                        lastOrder.od_total_amt_due || amountDue,
                                    ).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handlePrintReceipt}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                {hasAutoPrinted
                                    ? "Print Again"
                                    : "Print Receipt"}
                            </Button>
                            <Button
                                onClick={handleCloseSuccessModal}
                                variant="outline"
                                className="flex-1"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Card className="sticky top-2">
                <CardContent className="pt-4">
                    <div className="space-y-6 mb-4">
                        {/* Header */}
                        <div className="border-b pb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Current Order
                            </h2>
                            <Badge variant="secondary" className="px-3 py-1">
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                            </Badge>
                        </div>

                        {/* Cart Items List */}
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {cartItems.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">
                                    Your cart is empty
                                </p>
                            ) : (
                                cartItems.map((product) => {
                                    const productId =
                                        product.pd_id || product.id;
                                    const productName =
                                        product.pd_name || product.name;
                                    const productImage =
                                        product.pd_image || product.image;
                                    const productPrice = Number(
                                        product.pd_price ||
                                            product.ct_price ||
                                            0,
                                    );
                                    const quantity = product.ct_qty || 1;
                                    const isLoading = loadingItem === productId;

                                    return (
                                        <div
                                            key={productId}
                                            className="rounded-lg border p-4"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                {productImage && (
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                                                        <img
                                                            src={`/storage/${productImage}`}
                                                            alt={productName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <h3 className="font-medium text-gray-900 flex-1 ml-2">
                                                    {productName}
                                                </h3>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-gray-400 hover:text-red-600"
                                                    onClick={() =>
                                                        removeItem(productId)
                                                    }
                                                    disabled={isLoading}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-green-600">
                                                    ₱{productPrice.toFixed(2)}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                productId,
                                                                -1,
                                                            )
                                                        }
                                                        disabled={
                                                            quantity <= 1 ||
                                                            isLoading
                                                        }
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-8 text-center font-medium">
                                                        {quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                productId,
                                                                1,
                                                            )
                                                        }
                                                        disabled={isLoading}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <span className="text-sm font-bold text-green-600">
                                                    ₱
                                                    {(
                                                        productPrice * quantity
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Totals - Only show when cart has items */}
                        {cartItems.length > 0 && (
                            <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="font-bold">
                                        ₱{subTotal.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span>Discount:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-500">
                                            -₱{discount.toFixed(2)}
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            max={subTotal}
                                            onChange={(e) =>
                                                setDiscount(
                                                    Math.min(
                                                        Number(
                                                            e.target.value,
                                                        ) || 0,
                                                        subTotal,
                                                    ),
                                                )
                                            }
                                            className="w-20 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                                            placeholder="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between pt-3 pb-3 border-t border-b">
                                    <span className="text-lg font-bold">
                                        Total Amount Due:
                                    </span>
                                    <span className="text-lg font-bold text-green-600">
                                        ₱{amountDue.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Checkout Button */}
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 h-12 text-base rounded-full"
                            disabled={cartItems.length === 0}
                            onClick={() => setCheckoutOpen(true)}
                        >
                            {cartItems.length === 0
                                ? "Cart is Empty"
                                : `Checkout (₱${amountDue.toFixed(2)})`}
                        </Button>

                        {cartItems.length > 0 &&
                            paymentMethod === "cash" &&
                            payment < amountDue &&
                            payment > 0 && (
                                <p className="text-xs text-red-500 text-center mt-2">
                                    Payment amount is less than total. Customer
                                    still owes ₱
                                    {(amountDue - payment).toFixed(2)}
                                </p>
                            )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
