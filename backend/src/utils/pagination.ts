
// One home for the pagination vocabulary the whole API shares.

export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;     // total rows matching the filter (ignoring page)
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
    items: T[];
    pagination: PaginationMeta;
}

/** Translate a validated { page, limit } into Prisma's { skip, take }. */
export const getPaginationArgs = ({page, limit}: PaginationParams) => ({
    skip: (page - 1) * limit,
    take: limit
});

/** Build the response envelope from the total row count. */
export const buildPaginationMeta = (
    { page, limit }: PaginationParams,
    total: number
): PaginationMeta => {

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };

};