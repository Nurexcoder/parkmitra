import RiderForm from '@/components/RiderForm';

export default function NewRiderPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Add New Rider</h1>
        <p className="text-gray-600">Create a new rider profile and send QR code via email</p>
      </div>

      <RiderForm />
    </div>
  );
}
