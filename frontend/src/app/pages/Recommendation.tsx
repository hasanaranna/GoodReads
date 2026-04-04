import { Link } from "react-router";

export function Recommendation() {
    return (
        <div className="max-w-[860px] mx-auto px-4 py-10">
            {/* Breadcrumb */}
            <div className="text-[12px] mb-6 leading-relaxed">
                <Link
                    to="/mybooks"
                    className="text-[#00635d] no-underline hover:underline"
                >
                    My Books
                </Link>
                <span className="text-[#00635d]"> &gt; Recommendations</span>
            </div>

            {/* Page Header */}
            <div className="mb-6">
                <h1
                    className="text-[32px] font-bold text-[#382110] mb-2"
                    style={{ fontFamily: "Georgia, serif" }}
                >
                    Recommendations
                </h1>
                <p className="text-gray-600">
                    Discover books recommended based on your reading history.
                </p>
            </div>

            {/* Placeholder content */}
            <div className="bg-[#f4f0e6] rounded-lg p-8 text-center">
                <p className="text-gray-500 text-lg mb-4">
                    Recommendation logic coming soon...
                </p>
                <p className="text-gray-400">
                    We'll show you personalized book recommendations based on your ratings
                    and reading preferences.
                </p>
            </div>
        </div>
    );
}
