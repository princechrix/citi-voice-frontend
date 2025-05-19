"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  MessageSquare,
  Mail,
  Building,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Users,
  Search,
} from "lucide-react";
import FeedbackProcess from "./FeedbackProcess";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";

interface Category {
  id: string;
  name: string;
  description: string;
  primaryAgency: {
    id: string;
    name: string;
    acronym: string;
  };
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters.",
  }),
  needsLocation: z.boolean(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .nullable(),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ComplaintPage = () => {
  const router = useRouter();
  const { fetcher, poster } = useApi();
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisStep, setAnalysisStep] = React.useState(0);
  const form = useForm<FormValues>({
    resolver: zodResolver<FormValues, any, FormValues>(formSchema),
    defaultValues: {
      name: "",
      email: "",
      description: "",
      needsLocation: false,
      location: null,
      categoryId: "",
    },
  });

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<
    Category[]
  >({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const response = await fetcher("/category");
        return response.data || [];
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
  });

  const handleLocationToggle = async (checked: boolean) => {
    form.setValue("needsLocation", checked);

    if (checked) {
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          }
        );

        form.setValue("location", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        toast.success("Location captured successfully!");
      } catch (error) {
        toast.error(
          "Unable to retrieve your location. Please check your location settings."
        );
        form.setValue("needsLocation", false);
      }
    } else {
      form.setValue("location", null);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      setIsAnalyzing(true);
      setAnalysisStep(1);

      // First, classify the complaint
      const classificationResponse = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: values.description,
          categories: categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            agencyId: cat?.primaryAgency?.id,
          })),
        }),
      });

      if (!classificationResponse.ok) {
        throw new Error("Failed to classify complaint");
      }

      const classificationData = await classificationResponse.json();
      setAnalysisStep(2);

      // Submit the complaint to the backend
      const complaintResponse = await poster("/complaints", {
        subject: classificationData.subject,
        description: values.description,
        citizenEmail: values.email,
        citizenName: values.name,
        categoryId: classificationData.id,
        agencyId: classificationData.agencyId,
      });

      console.log(complaintResponse);

      if (complaintResponse.status !== 200) {
        throw new Error("Failed to submit complaint");
      }

      const complaintData = complaintResponse.complaint;
      setAnalysisStep(3);

      // Use the complaint ID from the response for tracking
      const complaintId = complaintData.id;

      // Redirect to success page with the tracking code in the URL path
      router.push(`/complaint/success/${complaintId}`);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  return (
    <div className="min-h-screen py-[100px]">
      <Toaster position="top-right" />
      <div className="container px-[8%] grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="proccess-wrapper hidden lg:flex w-full items-start gap-8 sticky top-[100px] h-fit">
          <FeedbackProcess />
        </div>
        <div className="flex-1 w-full">
          <div className="flex flex-col w-full gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Submit a Complaint
            </h1>
            <p className="text-gray-600">
              We&apos;re here to help. Fill out the form below to submit your
              complaint or feedback to the appropriate government agency.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {analysisStep === 1 && "Analyzing your complaint..."}
                    {analysisStep === 2 && "Routing to appropriate agency..."}
                    {analysisStep === 3 && "Submitting your complaint..."}
                  </h3>
                  <p className="text-gray-600">
                    {analysisStep === 1 &&
                      "Our AI is analyzing the content of your complaint to understand the issue better."}
                    {analysisStep === 2 &&
                      "We&apos;re identifying the most appropriate agency to handle your case."}
                    {analysisStep === 3 &&
                      "Almost done! We&apos;re finalizing your submission."}
                  </p>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email address"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide detailed information about your complaint"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Please include relevant details such as location,
                          date, and any previous communication.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="needsLocation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={handleLocationToggle}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include my location</FormLabel>
                          <FormDescription>
                            This will help us better understand the context of
                            your complaint.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("location") && (
                    <div className="text-sm text-gray-500">
                      Location captured:{" "}
                      {form.watch("location")?.latitude.toFixed(6)},{" "}
                      {form.watch("location")?.longitude.toFixed(6)}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-[45px] bg-primary text-white rounded-full hover:bg-blue-700 cursor-pointer font-semibold"
                    disabled={isLoadingCategories}
                  >
                    {isLoadingCategories ? "Loading..." : "Submit Complaint"}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintPage;
