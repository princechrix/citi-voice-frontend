import React from "react";
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
import { Button } from "@/components/ui/button";

interface HumanizedProcessStepProps {
  step: number;
  activeStep: number;
  isTransitioning: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string;
  illustration: React.ReactNode;
}

interface StatusBadgeProps {
  icon: React.ReactNode;
  text: string;
  color?: "blue" | "green";
  delay?: number;
}

interface ConnectionLinesProps {
  activeStep: number;
  isTransitioning: boolean;
}

const SubmitIllustration = () => (
  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
    <ClipboardCheck className="h-6 w-6 text-slate-400" />
  </div>
);

const AssignmentIllustration = () => (
  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
    <Users className="h-6 w-6 text-slate-400" />
  </div>
);

const TrackIllustration = () => (
  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
    <Search className="h-6 w-6 text-slate-400" />
  </div>
);

function HumanizedProcessStep({ step, activeStep, isTransitioning, icon, title, description, details, illustration }: HumanizedProcessStepProps) {
  const isActive = step === activeStep;
  const wasActive = (activeStep === 1 && step === 3) || step === activeStep - 1;

  return (
    <div className="relative mb-1 last:mb-0">
      <motion.div
        className="flex gap-3 relative z-10"
        animate={{
          opacity: isActive ? 1 : 1,
        }}
        transition={{
          duration: 0.8,
          ease: [0.19, 1.0, 0.22, 1.0],
        }}
      >
        <div className="relative flex-shrink-0">
          <motion.div
            className="flex items-center justify-center h-[44px] w-[44px] rounded-full bg-white border relative z-10"
            animate={{
              borderColor: isActive ? "#1B65FF" : "#e2e8f0",
              borderWidth: isActive ? "2px" : "1px",
              boxShadow: isActive ? "0 4px 12px rgba(27,101,255,0.08)" : "0 0 0 rgba(15, 23, 42, 0)",
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
            }}
          >
            <motion.div
              animate={{
                color: isActive ? "#1B65FF" : "#94a3b8",
              }}
              transition={{
                duration: 0.8,
              }}
            >
              {icon}
            </motion.div>
          </motion.div>
          <motion.div
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium z-20"
            animate={{
              backgroundColor: isActive ? "#1B65FF" : isTransitioning && wasActive ? ["#1B65FF", "#cbd5e1"] : "#cbd5e1",
              color: "#ffffff",
            }}
            transition={{
              duration: 0.6,
              backgroundColor: { duration: 0.8 },
            }}
          >
            {step}
          </motion.div>
        </div>
        <div className="flex-1">
          <motion.div
            className="p-2 rounded-lg"
            animate={{
              backgroundColor: isActive ? "#E6F0FF" : "transparent",
              boxShadow: isActive ? "0 2px 8px rgba(27,101,255,0.05)" : "0 0 0 rgba(15, 23, 42, 0)",
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <motion.h3
                  className="text-base font-semibold mb-1 flex items-center"
                  animate={{
                    color: isActive ? "#1B65FF" : "#64748b",
                  }}
                  transition={{ duration: 0.6 }}
                >
                  {title}
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 5 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="ml-2 text-slate-500"
                    >
                      <ArrowRight className="h-3 w-3 inline" />
                    </motion.span>
                  )}
                </motion.h3>
                <motion.p
                  className="text-sm font-medium mb-1"
                  animate={{ color: isActive ? "#1B65FF" : "#94a3b8" }}
                  transition={{ duration: 0.6 }}
                >
                  {description}
                </motion.p>
                <motion.p
                  className="text-xs"
                  animate={{ color: isActive ? "#64748b" : "#cbd5e1" }}
                  transition={{ duration: 0.6 }}
                >
                  {details}
                </motion.p>
              </div>
            </div>
            <AnimatePresence mode="wait">
              {isActive && (
                <motion.div
                  className="mt-2 pt-1 border-t border-slate-100"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    opacity: { duration: 0.5 },
                    height: { duration: 0.5 },
                  }}
                >
                  <motion.div
                    className="flex flex-wrap gap-2"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {step === 1 && (
                      <>
                        <StatusBadge
                          icon={<MessageSquare className="h-3 w-3" />}
                          text="Received"
                          delay={0.3}
                        />
                        <StatusBadge icon={<Mail className="h-3 w-3" />} text="Confirmed" delay={0.5} />
                      </>
                    )}
                    {step === 2 && (
                      <>
                        <StatusBadge icon={<Building className="h-3 w-3" />} text="Assigned" delay={0.3} />
                        <StatusBadge icon={<Calendar className="h-3 w-3" />} text="In Progress" delay={0.5} />
                      </>
                    )}
                    {step === 3 && (
                      <StatusBadge
                        icon={<CheckCircle className="h-3 w-3" />}
                        text="Ready"
                        color="green"
                        delay={0.3}
                      />
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ icon, text, color = "blue", delay = 0 }: StatusBadgeProps) {
  const bgColor = color === "green" ? "bg-green-50" : "bg-slate-50";
  const textColor = color === "green" ? "text-green-700" : "text-slate-700";
  const borderColor = color === "green" ? "border-green-100" : "border-slate-200";
  return (
    <motion.div
      className={`flex items-center gap-1.5 text-xs ${textColor} ${bgColor} px-2.5 py-1 rounded-full border ${borderColor}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: "easeOut",
      }}
    >
      {icon}
      {text}
    </motion.div>
  );
}

function ConnectionLines({ activeStep, isTransitioning }: ConnectionLinesProps) {
  return (
    <div className="absolute left-[43px] top-[22px] bottom-[22px] w-[2px] bg-slate-200">
      <motion.div
        className="absolute top-0 left-0 w-full bg-slate-400"
        animate={{
          height: `${(activeStep - 1) * 50}%`,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </div>
  );
}

const FeedbackProcess: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState(1);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveStep((prev) => (prev % 3) + 1);
        setIsTransitioning(false);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full  rounded-lg p-6 flex flex-col  relative overflow-hidden">
      {/* Enhanced background animation */}
      <motion.div
        
        animate={{
          opacity: [0.4, 0.6, 0.4],
          scale: [1, 1.02, 1],
          rotate: [0, 1, 0],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <h2 className="text-xl font-semibold mb-6 text-center relative z-10" style={{ color: '#1B65FF' }}>
      Complaint Handling
      </h2>
      <div className="wrapper">

      <div className="flex-1 flex flex-col gap-[40px] relative z-10">
        <HumanizedProcessStep
          step={1}
          activeStep={activeStep}
          isTransitioning={isTransitioning}
          icon={<ClipboardCheck className="h-6 w-6" />}
          title="Submit"
          description="Share your concerns"
          details="We review every submission carefully"
          illustration={<SubmitIllustration />}
        />
        <HumanizedProcessStep
          step={2}
          activeStep={activeStep}
          isTransitioning={isTransitioning}
          icon={<Users className="h-6 w-6" />}
          title="Review"
          description="AI-Powered Analysis"
          details="Smart routing to the right department using AI"
          illustration={<AssignmentIllustration />}
        />
        <HumanizedProcessStep
          step={3}
          activeStep={activeStep}
          isTransitioning={isTransitioning}
          icon={<Search className="h-6 w-6" />}
          title="Track"
          description="Stay informed"
          details="Monitor progress until resolved"
          illustration={<TrackIllustration />}
        />
      </div>
      <ConnectionLines activeStep={activeStep} isTransitioning={isTransitioning} />
    
      </div>
    </div>
  );
};

export default FeedbackProcess; 