import { useState } from "react";
import { useForm } from "@inertiajs/react";

export default function useAddProduct() {
    const [open, setOpen] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({
        ing_name: "",

        ing_qty: 0,
        ing_cost: 0,
        ing_cost: "",
        ing_mqty: 0,
        ing_image: null,
    });

    const openModal = () => setOpen(true);
    const closeModal = () => {
        setOpen(false);
        reset();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setData("ing_image", file);
    };

    const handleCategoryChange = (value) => {
        setData("cat_id", value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route("ingredient.store"), {
            onSuccess: () => {
                closeModal();
            },

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
        handleCategoryChange,
    };
}
