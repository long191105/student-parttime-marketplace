UPDATE listings
SET status = 'HIDDEN'
WHERE status = 'DELETED'
  AND EXISTS (
      SELECT 1
      FROM listing_reports
      WHERE listing_reports.listing_id = listings.id
        AND listing_reports.status = 'OPEN'
  );

DELETE FROM listing_reports
WHERE listing_id IN (SELECT id FROM listings WHERE status = 'DELETED');

DELETE FROM listings
WHERE status = 'DELETED';
