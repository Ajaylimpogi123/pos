import { useState } from "react";
import { useForm } from "@inertiajs/react";

export default function useAddCustomer() {
    const [open, setOpen] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({
        cust_fname: "",
        cust_lname: "",
        cust_contact: "",
        cust_image: null,
    });

    const openModal = () => setOpen(true);
    const closeModal = () => setOpen(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setData("cust_image", file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route("customer.store"), {
            onSuccess: () => {
                closeModal();
                reset();
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
        handleFileChange,
    };
}
