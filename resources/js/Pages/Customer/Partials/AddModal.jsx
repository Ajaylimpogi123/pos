import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/Components/InputError";
import useAddCategory from "../Hooks/useAddCategory";

export default function AddModal({ children }) {
    const {
        open,
        openModal,
        closeModal,
        data,
        setData,
        errors,
        processing,
        handleSubmit,
        handleFileChange,
    } = useAddCategory();

    return (
        <>
            {/* Trigger */}
            <div onClick={openModal}>{children}</div>

            <Dialog open={open} onOpenChange={closeModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="pb-4">
                            <DialogTitle>Add Category</DialogTitle>
                            <DialogDescription />
                        </DialogHeader>

                        <div className="grid gap-4">
                            <div className="grid gap-3">
                                <Label>Customer Name</Label>
                                <Input
                                    value={data.cust_fname}
                                    onChange={(e) =>
                                        setData("cust_fname", e.target.value)
                                    }
                                />
                                <InputError message={errors.cust_fname} />
                            </div>

                            <div className="grid gap-3">
                                <Label>Customer Last Name</Label>
                                <Input
                                    value={data.cust_lname}
                                    onChange={(e) =>
                                        setData("cust_lname", e.target.value)
                                    }
                                />
                                <InputError message={errors.cust_lname} />
                            </div>
                            <div className="grid gap-3">
                                <Label>Customer Contact</Label>
                                <Input
                                    value={data.cust_contact}
                                    onChange={(e) =>
                                        setData("cust_contact", e.target.value)
                                    }
                                />
                                <InputError message={errors.cust_contact} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Customer Image</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <InputError message={errors.cust_image} />
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={processing}
                                    onClick={closeModal}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>

                            <Button type="submit" disabled={processing}>
                                Submit
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
