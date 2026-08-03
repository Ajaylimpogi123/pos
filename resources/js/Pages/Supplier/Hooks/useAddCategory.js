import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";

export default function useAddSupplier() {
    const [open, setOpen] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({
        supplier_name: "",
        contact_person: "",
        contact_number: "",
        email: "",
        address: "",
    });

    const openModal = () => setOpen(true);
    const closeModal = () => setOpen(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route("supplier.store"), {
            onSuccess: () => {
                toast.success("Added Successfully", {
                    position: "top-center",
                });

                closeModal();
                reset();
            },
            onError: (error) => {
                toast.error("Faild to Add");
            },

            forceFormData: true,
            preserveScroll: true,
        });
    };

    return {
        // modal
        open,
        openModal,
        closeModal,

        // form
        data,
        setData,
        errors,
        processing,

        // handlers
        handleSubmit,
    };
}
