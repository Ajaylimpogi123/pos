import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
export default function useEditCategory(category) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({
        cat_name: "",
        cat_description: "",
        cat_image: null,
    });

    //  Sync form when category changes or modal opens
    useEffect(() => {
        if (!category || !open) return;

        setData({
            cat_name: category.cat_name || "",
            cat_description: category.cat_description || "",
            cat_image: null, // important: don't preload File
        });
    }, [category, open]);

    const openModal = () => setOpen(true);
    const closeModal = () => {
        setOpen(false);
        reset();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setData("cat_image", file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const toastId = toast.loading("Updating category...", {
            position: "top-center",
            duration: Infinity,
        });
        post(route("category.update", category.cat_id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.dismiss(toastId);
                toast.success("Category updated successfully!", {
                    duration: 3000,
                    position: "top-center",
                    classNames: { icon: "text-green-500" },
                });
                closeModal();
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
    };
}
