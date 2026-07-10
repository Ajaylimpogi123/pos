import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
export default function useEditProduct(ingredient) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({
        ing_name: "",
        ing_qty: 0,
        ing_cost: 0,
        unit: "",
        ing_mqty: 0,
        ing_image: null,
    });

    // 🔁 Sync form when modal opens
    useEffect(() => {
        if (!ingredient || !open) return;

        setData({
            ing_name: ingredient.ing_name || "",
            ing_qty: ingredient.ing_qty || 0,
            ing_cost: ingredient.ing_cost || 0,
            unit: ingredient.unit || "",
            ing_mqty: ingredient.ing_mqty || 0,
            ing_image: null, // never preload File
        });
    }, [ingredient, open]);

    const openModal = () => setOpen(true);
    const closeModal = () => {
        setOpen(false);
        reset();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setData("ing_image", file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const toastId = toast.loading("Updating ingredient...", {
            position: "top-center",
            duration: Infinity,
        });
        // console.log("Submitting with data:", data);
        post(route("ingredient.update", ingredient.ing_id), {
            onSuccess: () => {
                toast.dismiss(toastId);
                toast.success("Ingredient updated successfully!", {
                    duration: 3000,
                    position: "top-center",
                    classNames: {
                        icon: "text-green-500",
                    },
                });
                closeModal();
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                const errorMessage =
                    Object.values(errors)[0] || "Failed to update ingredient";
                toast.error(errorMessage, {
                    duration: 4000,
                    position: "top-center",
                    classNames: {
                        icon: "text-red-500",
                    },
                });
            },
            preserveScroll: true,
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
    };
}
