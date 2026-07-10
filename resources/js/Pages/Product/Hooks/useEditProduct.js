import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";

export default function useEditProduct(product) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, errors, processing, reset, setError } =
        useForm({
            cat_id: 0,
            pd_name: "",
            pd_description: "",
            pd_price: 0,
            pd_qty: 0,
            pd_cost: 0,
            pd_mqty: 0,
            pd_image: null,
            ingredients: [],
        });

    // Sync form + ingredients when modal opens
    useEffect(() => {
        if (!product || !open) return;

        setData({
            cat_id: product.cat_id || 0,
            pd_name: product.pd_name || "",
            pd_description: product.pd_description || "",
            pd_price: product.pd_price || 0,
            pd_qty: product.pd_qty || 0,
            pd_cost: product.pd_cost || 0,
            pd_mqty: product.pd_mqty || 0,
            pd_image: null,
            ingredients: (product.ingredients ?? []).map((ing) => ({
                ing_id: ing.ing_id,
                ing_name: ing.ing_name,
                unit: ing.unit,
                pd_ing_qty: ing.pivot?.pd_ing_qty ?? 1,
            })),
        });
    }, [product, open]);

    const openModal = () => setOpen(true);
    const closeModal = () => {
        setOpen(false);
        reset();
    };

    const handleFileChange = (e) => {
        setData("pd_image", e.target.files[0]);
    };

    const addIngredient = (ingredient) => {
        const alreadyAdded = data.ingredients.find(
            (i) => i.ing_id === ingredient.ing_id,
        );
        if (alreadyAdded) return;

        setData("ingredients", [
            ...data.ingredients,
            {
                ing_id: ingredient.ing_id,
                ing_name: ingredient.ing_name,
                unit: ingredient.unit,
                pd_ing_qty: 1,
            },
        ]);
    };

    const removeIngredient = (ing_id) => {
        setData(
            "ingredients",
            data.ingredients.filter((i) => i.ing_id !== ing_id),
        );
    };

    const updateIngredientQty = (ing_id, qty) => {
        setData(
            "ingredients",
            data.ingredients.map((i) =>
                i.ing_id === ing_id
                    ? { ...i, pd_ing_qty: parseFloat(qty) || 0 }
                    : i,
            ),
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const toastId = toast.loading("Updating product...", {
            position: "top-center",
            duration: Infinity,
        });

        post(route("product.update", product.pd_id), {
            forceFormData: true, // handles file + nested array serialization
            preserveScroll: true,
            onSuccess: () => {
                toast.dismiss(toastId);
                toast.success("Product updated successfully!", {
                    duration: 3000,
                    position: "top-center",
                    classNames: { icon: "text-green-500" },
                });
                closeModal();
            },
            onError: (errs) => {
                toast.dismiss(toastId);
                const errorMessage =
                    Object.values(errs)[0] || "Failed to update product";
                toast.error(errorMessage, {
                    duration: 4000,
                    position: "top-center",
                    classNames: { icon: "text-red-500" },
                });
            },
        });
    };

    return {
        open,
        openModal,
        closeModal,
        data,
        setData,
        errors,
        processing,
        handleSubmit,
        handleFileChange,
        addIngredient,
        removeIngredient,
        updateIngredientQty,
    };
}
