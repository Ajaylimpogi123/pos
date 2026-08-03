import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
export default function useEditCustomer(customer) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({
        cust_fname: "",
        cust_lname: "",
        cust_contact: "",
        cust_image: null,
    });

    //  Sync form when customer changes or modal opens
    useEffect(() => {
        if (!customer || !open) return;

        setData({
            cust_fname: customer.cust_fname || "",
            cust_lname: customer.cust_lname || "",
            cust_contact: customer.cust_contact || "",
            cust_image: null, // important: don't preload File
        });
    }, [customer, open]);

    const openModal = () => setOpen(true);
    const closeModal = () => {
        setOpen(false);
        reset();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setData("cust_image", file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const toastId = toast.loading("Updating customer...", {
            position: "top-center",
            duration: Infinity,
        });
        post(route("customer.update", customer.cust_id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.dismiss(toastId);
                toast.success("Customer updated successfully!", {
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
