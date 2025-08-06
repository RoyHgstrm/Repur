import { SignIn } from "@clerk/nextjs";
 
export default function Page() {
  return (
    <div className="flex justify-center items-center bg-gray-900">
      <SignIn 
        appearance={{
          elements: {
            card: "bg-gray-800 text-white border border-gray-700 shadow-xl rounded-xl",
            headerTitle: "text-white text-2xl",
            headerSubtitle: "text-gray-400",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500/40",
            socialButtonsBlockButton: "bg-gray-700 hover:bg-gray-600 text-white",
            footerActionLink: "text-blue-400 hover:text-blue-300",
            footerActionText: "text-gray-400"
          },
          layout: {
            socialButtonsVariant: "iconButton",
            showOptionalFields: false
          }
        }}
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
      />
    </div>
  );
}