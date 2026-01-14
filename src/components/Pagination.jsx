import React from 'react'
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
const Pagination = ({ currentPage, pageSize, totalCount, handlePageChange, handleLimitChange, title,loading }) => {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Show</span>
      <select
        value={pageSize}
        onChange={handleLimitChange}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:ring-2 focus:ring-blue-500"
      >
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="40">40</option>
      </select>
      <span className="text-sm text-gray-600">entries</span>
    </div>

    <div className="text-sm text-gray-500">
      Showing {(currentPage - 1) * pageSize + 1} to{" "}
      {Math.min(currentPage * pageSize, totalCount)} of {totalCount} {title}
    </div>

    <div className="flex items-center justify-center mt-6">
      <div className="flex items-center -space-x-px border rounded-lg overflow-hidden bg-white shadow-sm">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="px-3 py-2 border-r hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FaChevronLeft size={18} className="text-gray-600" />
        </button>

        {/* Sahifa raqamlari */}
        {Array.from(
          { length: Math.ceil(totalCount / pageSize) },
          (_, i) => {
            const pageNum = i + 1;

            // Faqat kerakli sahifalarni ko'rsatish (Logic: joriy sahifa va uning atrofidagilar)
            if (
              pageNum === 1 ||
              pageNum === Math.ceil(totalCount / pageSize) ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-4 py-2 border-r last:border-r-0 text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            } else if (
              pageNum === currentPage - 2 ||
              pageNum === currentPage + 2
            ) {
              return (
                <span
                  key={pageNum}
                  className="px-3 py-2 border-r text-gray-400"
                >
                  ...
                </span>
              );
            }
            return null;
          }
        )}

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={
            currentPage === Math.ceil(totalCount / pageSize) || loading
          }
          className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FaChevronRight size={18} className="text-gray-600" />
        </button>
      </div>
    </div>
  </div>
  )
}

export default Pagination