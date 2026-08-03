import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
export default function useEditCategory(supplier) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({
        supplier_name: "",
        contact_person: "",
        contact_number: "",
        email: "",
        address: "",
    });

    //  Sync form when category changes or modal opens
    useEffect(() => {
        if (!supplier || !open) return;

        setData({
            supplier_name: supplier.supplier_name || "",
            contact_person: supplier.contact_person || "",
            contact_number: supplier.contact_number || "",
            email: supplier.email || "",
            address: supplier.address || "",
        });
    }, [supplier, open]);

    const openModal = () => setOpen(true);
    const closeModal = () => {
        setOpen(false);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const toastId = toast.loading("Updating Supplier...", {
            position: "top-center",
            duration: Infinity,
        });
        post(route("supplier.update", supplier.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.dismiss(toastId);
                toast.success("Supplier updated successfully!", {
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
    };
}
