import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CategoryItems from "./Partials/CategoryItems";
import CartSummary from "./Partials/CartSummary";

export default function Menu({
    setCartItemsCount,
    products,
    categories,
    cartItems,
    cartItemsCount,
    filters,
}) {
    const [cartProducts, setCartProducts] = useState([]);

    useEffect(() => {
        if (cartItems) {
            if (Array.isArray(cartItems)) {
                setCartProducts(cartItems);
                if (setCartItemsCount) {
                    const totalItems = cartItems.reduce(
                        (sum, item) => sum + item.ct_qty,
                        0,
                    );
                    setCartItemsCount(totalItems);
                }
            } else if (cartItems.items && Array.isArray(cartItems.items)) {
                setCartProducts(cartItems.items);
                if (setCartItemsCount) {
                    setCartItemsCount(
                        cartItems.total_items || cartItems.items.length,
                    );
                }
            }
        }
    }, [cartItems, setCartItemsCount]);

    return (
        <AuthenticatedLayout>
            <Head title="Menu" />
            <div className="relative z-10 py-8">
                <div className="flex-1 space-y-6 p-4 md:p-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <CategoryItems
                                categories={categories}
                                products={products}
                                cartItems={cartProducts}
                                filters={filters}
                            />
                        </div>

                        <div className="hidden lg:block space-y-6">
                            <CartSummary
                                products={cartProducts}
                                cartItemsCount={cartItemsCount}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
