
# تقرير هيكل قاعدة بيانات المشروع (Supabase)

## مقدمة

هذا التقرير يوفر نظرة شاملة على هيكل قاعدة البيانات المستخدمة في هذا المشروع، والمستضافة على Supabase. يتضمن تفاصيل الجداول، الأعمدة، أنواع البيانات، العلاقات بين الجداول، والمفاتيح الأساسية والخارجية.

## الجداول الأساسية

### 1. جدول: `products`

**الوصف:** يخزن معلومات حول جميع المنتجات المتوفرة في النظام.

| اسم العمود        | نوع البيانات        | PK | FK | يشير إلى (جدول.عمود) | ملاحظات                                                                 |
|-------------------|---------------------|----|----|-----------------------|-------------------------------------------------------------------------|
| `id`              | `uuid`              | ✓  |    |                       | المفتاح الأساسي، يُنشأ تلقائياً (`gen_random_uuid()`)                   |
| `name`            | `text`              |    |    |                       | اسم المنتج (Not Null)                                                    |
| `description`     | `text`              |    |    |                       | وصف المنتج (Nullable)                                                   |
| `unit`            | `text`              |    |    |                       | وحدة القياس (Not Null, e.g., "قطعة", "كيلو", "غرام", "علبة", "لتر")      |
| `product_type`    | `text`              |    |    |                       | نوع المنتج (Not Null, e.g., "منتج بباركود", "منتج موصول", "منتج عادي") |
| `barcode_number`  | `text`              |    |    |                       | رقم الباركود (Nullable, Unique - يُفضل)                                 |
| `purchase_price`  | `numeric`           |    |    |                       | سعر الشراء (Not Null, Default 0)                                        |
| `sale_price`      | `numeric`           |    |    |                       | سعر البيع (Not Null, Default 0)                                         |
| `stock`           | `integer`           |    |    |                       | الكمية الحالية في المخزون (Not Null, Default 0)                          |
| `min_stock_level` | `integer`           |    |    |                       | الحد الأدنى للمخزون للتنبيه (Not Null, Default 0)                       |
| `category`        | `text`              |    |    |                       | فئة المنتج (Not Null, e.g., "فواكه", "خضروات")                           |
| `image_url`       | `text`              |    |    |                       | رابط صورة المنتج (Nullable)                                             |
| `data_ai_hint`    | `text`              |    |    |                       | تلميح للذكاء الاصطناعي للصور (Nullable)                                 |
| `created_at`      | `timestamp with time zone` |    |    |                       | تاريخ إنشاء السجل (Default `now()`, Not Null)                           |

---

### 2. جدول: `clients`

**الوصف:** يخزن معلومات العملاء.

| اسم العمود        | نوع البيانات        | PK | FK | يشير إلى (جدول.عمود) | ملاحظات                                                              |
|-------------------|---------------------|----|----|-----------------------|----------------------------------------------------------------------|
| `id`              | `uuid`              | ✓  |    |                       | المفتاح الأساسي، يُنشأ تلقائياً (`gen_random_uuid()`)                |
| `name`            | `text`              |    |    |                       | اسم العميل (Not Null)                                                 |
| `email`           | `text`              |    |    |                       | البريد الإلكتروني (Nullable, Unique - يُفضل)                           |
| `phone`           | `text`              |    |    |                       | رقم الهاتف (Not Null)                                                |
| `total_spent`     | `numeric`           |    |    |                       | إجمالي ما أنفقه العميل (Nullable, Default 0)                           |
| `avatar`          | `text`              |    |    |                       | رابط صورة العميل (Nullable)                                          |
| `join_date`       | `date`              |    |    |                       | تاريخ انضمام العميل (Nullable, Default `current_date`)                |
| `address`         | `text`              |    |    |                       | عنوان العميل (Nullable)                                              |
| `notes`           | `text`              |    |    |                       | ملاحظات حول العميل (Nullable)                                        |
| `tags`            | `text[]`            |    |    |                       | وسوم (Tags) للعميل (Nullable)                                        |
| `credit_balance`  | `numeric`           |    |    |                       | الرصيد الآجل/الدين (Nullable, Default 0). سالب يعني العميل مدين.     |
| `created_at`      | `timestamp with time zone` |    |    |                       | تاريخ إنشاء السجل (Default `now()`, Not Null)                        |

---

### 3. جدول: `sales` (عمليات المبيعات الرئيسية)

**الوصف:** يسجل كل عملية بيع (فاتورة).

| اسم العمود             | نوع البيانات        | PK | FK | يشير إلى (جدول.عمود) | ملاحظات                                                                 |
|------------------------|---------------------|----|----|-----------------------|-------------------------------------------------------------------------|
| `id`                   | `uuid`              | ✓  |    |                       | المفتاح الأساسي، يُنشأ تلقائياً (`gen_random_uuid()`)                   |
| `sale_date`            | `timestamp with time zone` |    |    |                       | تاريخ ووقت البيع (Default `now()`, Not Null)                            |
| `client_id`            | `uuid`              |    | ✓  | `clients.id`          | معرّف العميل (Nullable لعملاء البيع النقدي)                              |
| `user_id`              | `uuid`              |    | ✓  | `auth.users.id`       | معرّف المستخدم الذي أجرى البيع (Not Null)                              |
| `total_amount`         | `numeric`           |    |    |                       | المبلغ الإجمالي للفاتورة بعد الخصم (Not Null)                          |
| `discount_amount`      | `numeric`           |    |    |                       | مبلغ الخصم المطبق على الفاتورة (Nullable, Default 0)                  |
| `payment_method`       | `text`              |    |    |                       | طريقة الدفع (Not Null, e.g., "Cash", "Card")                             |
| `partner_id`           | `uuid`              |    | ✓  | `partners.partner_id` | معرّف الشريك (Nullable, ON DELETE SET NULL)                             |
| `partner_share_amount` | `numeric`           |    |    |                       | نصيب الشريك من ربح هذه الفاتورة (Nullable)                              |
| `created_at`           | `timestamp with time zone` |    |    |                       | تاريخ إنشاء السجل (Default `now()`, Not Null)                           |

---

### 4. جدول: `sale_items` (عناصر عمليات المبيعات)

**الوصف:** يخزن تفاصيل المنتجات المباعة في كل فاتورة بيع.

| اسم العمود    | نوع البيانات        | PK | FK | يشير إلى (جدول.عمود)          | ملاحظات                                                              |
|---------------|---------------------|----|----|-------------------------------|----------------------------------------------------------------------|
| `id`          | `uuid`              | ✓  |    |                               | المفتاح الأساسي، يُنشأ تلقائياً (`gen_random_uuid()`)                |
| `sale_id`     | `uuid`              |    | ✓  | `sales.id` (ON DELETE CASCADE) | معرّف فاتورة البيع (Not Null)                                       |
| `product_id`  | `uuid`              |    | ✓  | `products.id` (ON DELETE RESTRICT) | معرّف المنتج (Not Null)                                             |
| `quantity`    | `numeric`           |    |    |                               | الكمية المباعة (Not Null, numeric للتعامل مع الأوزان)                 |
| `unit_price`  | `numeric`           |    |    |                               | سعر الوحدة وقت البيع (Not Null)                                      |
| `total_price` | `numeric`           |    |    |                               | السعر الإجمالي للبند (Not Null, `quantity * unit_price`)               |
| `created_at`  | `timestamp with time zone` |    |    |                               | تاريخ إنشاء السجل (Default `now()`, Not Null)                        |

---

### 5. جدول: `partners`

**الوصف:** يخزن معلومات الشركاء ونسب مشاركتهم في الأرباح ومبالغ استثماراتهم.

| اسم العمود                | نوع البيانات        | PK | FK | يشير إلى (جدول.عمود) | ملاحظات                                                              |
|---------------------------|---------------------|----|----|-----------------------|----------------------------------------------------------------------|
| `partner_id`              | `uuid`              | ✓  |    |                       | المفتاح الأساسي، يُنشأ تلقائياً (`gen_random_uuid()`)                |
| `partner_name`            | `text`              |    |    |                       | اسم الشريك (Not Null)                                                 |
| `profit_share_percentage` | `numeric`           |    |    |                       | نسبة المشاركة في الربح (Not Null, CHECK 0-100)                       |
| `initial_investment`      | `numeric`           |    |    |                       | المبلغ الأولي الذي استثمره الشريك (Nullable, Default 0)            |
| `created_at`              | `timestamp with time zone` |    |    |                       | تاريخ إنشاء السجل (Default `now()`, Not Null)                        |

---

### 6. جدول: `suppliers`

**الوصف:** يخزن معلومات الموردين.

| اسم العمود        | نوع البيانات        | PK | FK | يشير إلى (جدول.عمود) | ملاحظات                                                              |
|-------------------|---------------------|----|----|-----------------------|----------------------------------------------------------------------|
| `id`              | `uuid`              | ✓  |    |                       | المفتاح الأساسي، يُنشأ تلقائياً (`gen_random_uuid()`)                |
| `name`            | `text`              |    |    |                       | اسم المورد (Not Null)                                                 |
| `contact_person`  | `text`              |    |    |                       | مسؤول التواصل (Nullable)                                            |
| `email`           | `text`              |    |    |                       | البريد الإلكتروني (Nullable)                                          |
| `phone`           | `text`              |    |    |                       | رقم الهاتف (Not Null)                                                |
| `address`         | `text`              |    |    |                       | عنوان المورد (Nullable)                                              |
| `notes`           | `text`              |    |    |                       | ملاحظات (Nullable)                                                   |
| `created_at`      | `timestamp with time zone` |    |    |                       | تاريخ إنشاء السجل (Default `now()`, Not Null)                        |

---

### 7. جدول: `purchase_invoices` (فواتير الشراء)

**الوصف:** يسجل فواتير المشتريات من الموردين.

| اسم العمود       | نوع البيانات        | PK | FK | يشير إلى (جدول.عمود) | ملاحظات                                                                 |
|------------------|---------------------|----|----|-----------------------|-------------------------------------------------------------------------|
| `id`             | `uuid`              | ✓  |    |                       | المفتاح الأساسي، يُنشأ تلقائياً (`gen_random_uuid()`)                   |
| `invoice_number` | `text`              |    |    |                       | رقم فاتورة المورد (Not Null, Unique - يُفضل)                              |
| `supplier_id`    | `uuid`              |    | ✓  | `suppliers.id`        | معرّف المورد (Not Null)                                                 |
| `invoice_date`   | `date`              |    |    |                       | تاريخ الفاتورة (Not Null)                                               |
| `due_date`       | `date`              |    |    |                       | تاريخ استحقاق الدفع (Nullable)                                          |
| `tax_amount`     | `numeric`           |    |    |                       | مبلغ الضريبة (Nullable, Default 0)                                       |
| `grand_total`    | `numeric`           |    |    |                       | المبلغ الإجمالي للفاتورة (Not Null)                                      |
| `status`         | `text`              |    |    |                       | حالة الفاتورة (Not Null, e.g., "غير مدفوعة", "مدفوعة بالكامل")         |
| `notes`          | `text`              |    |    |                       | ملاحظات (Nullable)                                                      |
| `created_at`     | `timestamp with time zone` |    |    |                       | تاريخ إنشاء السجل (Default `now()`, Not Null)                           |

---

### 8. جدول: `purchase_invoice_items` (عناصر فواتير الشراء)

**الوصف:** يخزن تفاصيل المنتجات المشتراة في كل فاتورة شراء.

| اسم العمود            | نوع البيانات        | PK | FK | يشير إلى (جدول.عمود)                | ملاحظات                                                              |
|-----------------------|---------------------|----|----|-------------------------------------|----------------------------------------------------------------------|
| `id`                  | `uuid`              | ✓  |    |                                     | المفتاح الأساسي، يُنشأ تلقائياً (`gen_random_uuid()`)                |
| `purchase_invoice_id` | `uuid`              |    | ✓  | `purchase_invoices.id` (ON DELETE CASCADE) | معرّف فاتورة الشراء (Not Null)                                     |
| `product_id`          | `uuid`              |    | ✓  | `products.id` (ON DELETE RESTRICT)   | معرّف المنتج (Not Null)                                             |
| `quantity`            | `numeric`           |    |    |                                     | الكمية المشتراة (Not Null)                                           |
| `unit_price`          | `numeric`           |    |    |                                     | سعر الوحدة عند الشراء (Not Null)                                     |
| `total_price`         | `numeric`           |    |    |                                     | السعر الإجمالي للبند (Not Null, `quantity * unit_price`)             |
| `created_at`          | `timestamp with time zone` |    |    |                                     | تاريخ إنشاء السجل (Default `now()`, Not Null)                        |

---

### 9. جدول: `expenses` (عمليات المصروفات)

**الوصف:** يسجل المصروفات التشغيلية المختلفة.

| اسم العمود    | نوع البيانات        | PK | FK | يشير إلى (جدول.عمود) | ملاحظات                                                              |
|---------------|---------------------|----|----|-----------------------|----------------------------------------------------------------------|
| `id`          | `uuid`              | ✓  |    |                       | المفتاح الأساسي، يُنشأ تلقائياً (`gen_random_uuid()`)                |
| `description` | `text`              |    |    |                       | وصف المصروف (Not Null)                                               |
| `amount`      | `numeric`           |    |    |                       | مبلغ المصروف (Not Null)                                              |
| `expense_date`| `date`              |    |    |                       | تاريخ المصروف (Not Null)                                             |
| `category`    | `text`              |    |    |                       | فئة المصروف (Not Null, e.g., "إيجار", "رواتب")                       |
| `user_id`     | `uuid`              |    | ✓  | `auth.users.id`       | معرّف المستخدم الذي سجل المصروف (Nullable)                           |
| `created_at`  | `timestamp with time zone` |    |    |                       | تاريخ إنشاء السجل (Default `now()`, Not Null)                        |

---

### 10. جدول: `auth.users` (مدمج من Supabase)

**الوصف:** جدول مدمج من Supabase لإدارة مصادقة المستخدمين.

| اسم العمود             | نوع البيانات        | PK | FK | ملاحظات                                                                 |
|------------------------|---------------------|----|----|-------------------------------------------------------------------------|
| `id`                   | `uuid`              | ✓  |    | المفتاح الأساسي                                                          |
| `email`                | `text`              |    |    | البريد الإلكتروني للمستخدم (Unique)                                        |
| `encrypted_password`   | `text`              |    |    | كلمة المرور المشفرة                                                      |
| `created_at`           | `timestamp with time zone` |    |    | تاريخ إنشاء حساب المستخدم                                                |
| `updated_at`           | `timestamp with time zone` |    |    | تاريخ آخر تحديث لحساب المستخدم                                          |
| `last_sign_in_at`      | `timestamp with time zone` |    |    | تاريخ آخر تسجيل دخول                                                     |
| `raw_user_meta_data`   | `jsonb`             |    |    | بيانات تعريفية إضافية للمستخدم (e.g., `full_name`, `avatar_url`)         |
| ... (أعمدة أخرى خاصة بـ Supabase Auth) |                     |    |    |                                                                         |

---

### 11. جدول مقترح: `profiles`

**الوصف:** جدول لتخزين معلومات الملف الشخصي الإضافية للمستخدمين، مرتبط بجدول `auth.users`. يُسهل إدارة الأدوار والحالات.

| اسم العمود   | نوع البيانات        | PK | FK | يشير إلى (جدول.عمود)                | ملاحظات                                                         |
|--------------|---------------------|----|----|--------------------------------------|-----------------------------------------------------------------|
| `id`         | `uuid`              | ✓  | ✓  | `auth.users.id` (ON DELETE CASCADE) | المفتاح الأساسي، ومرتبط بـ `auth.users`                         |
| `full_name`  | `text`              |    |    |                                      | الاسم الكامل للمستخدم (Nullable)                                |
| `avatar_url` | `text`              |    |    |                                      | رابط صورة المستخدم (Nullable)                                   |
| `role`       | `text`              |    |    |                                      | دور المستخدم في النظام (Nullable, e.g., "مسؤول", "مدير مبيعات") |
| `status`     | `text`              |    |    |                                      | حالة المستخدم (Nullable, e.g., "نشط", "غير نشط")                 |
| `updated_at` | `timestamp with time zone` |    |    |                                      | تاريخ آخر تحديث للملف الشخصي (Default `now()`, Not Null)      |

---

## Supabase Views (طرق العرض)

هذه Views تم ذكرها في كود التقارير لتسهيل جلب البيانات المجمعة:

1.  **`gross_profit_per_product_view`**
    *   **الغرض:** حساب الربح الإجمالي لكل منتج في كل عملية بيع.
    *   **الأعمدة الرئيسية المتوقعة:** `product_id`, `product_name`, `sale_date`, `total_quantity_sold`, `total_revenue`, `total_cost_of_goods_sold`, `gross_profit`.
    *   **SQL المقترح (يجب اختباره وتعديله حسب الحاجة):**
        ```sql
        CREATE OR REPLACE VIEW public.gross_profit_per_product_view AS
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            s.sale_date,
            si.quantity AS quantity_sold_in_item, -- Renamed for clarity per item
            si.total_price AS item_revenue, -- Revenue from this specific sale item
            (si.quantity * p.purchase_price) AS item_cost_of_goods_sold, -- COGS for this specific sale item
            (si.total_price - (si.quantity * p.purchase_price)) AS item_gross_profit -- Gross profit for this specific sale item
        FROM
            public.sale_items si
        JOIN
            public.products p ON si.product_id = p.id
        JOIN
            public.sales s ON si.sale_id = s.id;
        ```

2.  **`monthly_performance_summary_view`**
    *   **الغرض:** تلخيص الأداء المالي شهرياً.
    *   **الأعمدة الرئيسية المتوقعة:** `period_label` (e.g., "YYYY-MM"), `total_sales`, `total_purchases`, `total_expenses`, `gross_profit`.
    *   **SQL المقترح (يجب اختباره وتعديله حسب الحاجة):**
        ```sql
        CREATE OR REPLACE VIEW public.monthly_performance_summary_view AS
        WITH monthly_sales AS (
            SELECT date_trunc('month', s.sale_date)::date AS report_month,
                   SUM(s.total_amount) AS total_sales_amount
            FROM public.sales s
            GROUP BY 1
        ), monthly_purchases AS (
            SELECT date_trunc('month', pi.invoice_date)::date AS report_month,
                   SUM(pi.grand_total) AS total_purchases_amount
            FROM public.purchase_invoices pi
            GROUP BY 1
        ), monthly_expenses AS (
            SELECT date_trunc('month', e.expense_date)::date AS report_month,
                   SUM(e.amount) AS total_expenses_amount
            FROM public.expenses e
            GROUP BY 1
        ), monthly_gross_profit_calc AS (
            SELECT date_trunc('month', gppv.sale_date)::date AS report_month,
                   SUM(gppv.item_gross_profit) AS total_gross_profit_amount -- Summing item_gross_profit
            FROM public.gross_profit_per_product_view gppv
            GROUP BY 1
        )
        SELECT
            to_char(periods.report_month, 'YYYY-MM') AS period_label,
            COALESCE(ms.total_sales_amount, 0) AS total_sales,
            COALESCE(mp.total_purchases_amount, 0) AS total_purchases,
            COALESCE(me.total_expenses_amount, 0) AS total_expenses,
            COALESCE(mgp.total_gross_profit_amount, 0) AS gross_profit
        FROM (
            SELECT DISTINCT report_month FROM monthly_sales
            UNION SELECT DISTINCT report_month FROM monthly_purchases
            UNION SELECT DISTINCT report_month FROM monthly_expenses
            UNION SELECT DISTINCT report_month FROM monthly_gross_profit_calc
        ) AS periods
        LEFT JOIN monthly_sales ms ON periods.report_month = ms.report_month
        LEFT JOIN monthly_purchases mp ON periods.report_month = mp.report_month
        LEFT JOIN monthly_expenses me ON periods.report_month = me.report_month
        LEFT JOIN monthly_gross_profit_calc mgp ON periods.report_month = mgp.report_month
        ORDER BY periods.report_month DESC;
        ```
3.  **`detailed_stock_report_view`** (كما تم استخدامه سابقاً)
    *   **الغرض:** عرض تفاصيل المخزون لكل منتج، بما في ذلك متوسط سعر الشراء.
    *   **الأعمدة الرئيسية المتوقعة:** `product_id`, `product_name`, `category`, `current_stock`, `min_stock_level`, `last_purchase_price`, `average_purchase_price`.
    *   **SQL المقترح (يجب اختباره وتعديله حسب الحاجة):**
        ```sql
        CREATE OR REPLACE VIEW public.detailed_stock_report_view AS
        WITH avg_purchase_prices AS (
            SELECT
                pii.product_id,
                CASE
                    WHEN SUM(pii.quantity) = 0 THEN NULL
                    ELSE SUM(pii.total_price) / SUM(pii.quantity)
                END as avg_unit_price
            FROM public.purchase_invoice_items pii
            WHERE pii.quantity > 0
            GROUP BY pii.product_id
        )
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.category,
            p.stock AS current_stock,
            p.min_stock_level,
            p.purchase_price AS last_purchase_price,
            app.avg_unit_price AS average_purchase_price
        FROM public.products p
        LEFT JOIN avg_purchase_prices app ON p.id = app.product_id
        ORDER BY p.name;
        ```
4.  **`partner_profit_summary_view` (جديد مقترح لتقارير الشركاء)**
    *   **الغرض:** تلخيص إجمالي نصيب كل شريك من أرباح الفواتير المرتبطة به.
    *   **الأعمدة الرئيسية المتوقعة:** `partner_id`, `partner_name`, `total_profit_share_received`, `number_of_sales_involved`.
    *   **SQL المقترح (يجب اختباره وتعديله حسب الحاجة):**
        ```sql
        CREATE OR REPLACE VIEW public.partner_profit_summary_view AS
        SELECT
            p.partner_id,
            p.partner_name,
            SUM(s.partner_share_amount) AS total_profit_share_received,
            COUNT(s.id) AS number_of_sales_involved,
            MIN(s.sale_date) AS first_sale_date,
            MAX(s.sale_date) AS last_sale_date
        FROM
            public.partners p
        JOIN
            public.sales s ON p.partner_id = s.partner_id
        WHERE
            s.partner_share_amount IS NOT NULL
        GROUP BY
            p.partner_id, p.partner_name
        ORDER BY
            total_profit_share_received DESC;
        ```
    *   **`partner_daily_sales_profit_view` (جديد مقترح لتقارير الشركاء اليومية)**
        *   **الغرض:** عرض تفاصيل مبيعات كل شريك يومياً مع حصته من الربح.
        *   **الأعمدة:** `sale_id`, `sale_date`, `partner_id`, `partner_name`, `total_sale_amount`, `total_cost_of_goods_sold_for_sale`, `sale_profit`, `partner_share_from_sale`.
        *   **SQL المقترح:**
            ```sql
            CREATE OR REPLACE VIEW public.partner_daily_sales_profit_view AS
            WITH sale_cogs AS (
                SELECT
                    si.sale_id,
                    SUM(si.quantity * pr.purchase_price) as total_cost
                FROM public.sale_items si
                JOIN public.products pr ON si.product_id = pr.id
                GROUP BY si.sale_id
            )
            SELECT
                s.id as sale_id,
                s.sale_date,
                s.partner_id,
                p.partner_name,
                s.total_amount as total_sale_amount,
                COALESCE(sc.total_cost, 0) as total_cost_of_goods_sold_for_sale,
                (s.total_amount - COALESCE(sc.total_cost, 0)) as sale_profit,
                s.partner_share_amount as partner_share_from_sale
            FROM public.sales s
            JOIN public.partners p ON s.partner_id = p.partner_id
            LEFT JOIN sale_cogs sc ON s.id = sc.sale_id
            WHERE s.partner_id IS NOT NULL AND s.partner_share_amount IS NOT NULL;
            ```

---

## تحديد جداول العمليات الرئيسية

*   **عمليات المبيعات:**
    *   `sales`: لتسجيل الفواتير الرئيسية للمبيعات.
    *   `sale_items`: لتسجيل البنود التفصيلية لكل فاتورة بيع.
*   **عمليات المصروفات:**
    *   `expenses`: لتسجيل المصروفات التشغيلية.
*   **عمليات المدفوعات/القبض والصرف المالي:**
    *   `sales`: يسجل الإيرادات من المبيعات.
    *   `expenses`: يسجل المدفوعات للمصروفات.
    *   `purchase_invoices`: يسجل الالتزامات المالية للموردين (المستحقات للدفع). عمود `status` يوضح حالة الدفع.
    *   `clients`: عمود `credit_balance` يسجل ديون العملاء (المستحقات للقبض) أو الأرصدة الدائنة لهم.
    *   لا يوجد جدول مخصص منفرد لـ "المدفوعات" أو "القبض" حالياً، بل يتم تتبع هذه الجوانب من خلال حالة الفواتير وأرصدة العملاء والمصروفات المسجلة. قد يتطلب نظام أكثر تعقيداً جداول مخصصة لتتبع كل دفعة مالية على حدة.

## ملاحظات وعلاقات هامة

*   **`auth.users` و `profiles`:** العلاقة بينهما (واحد لواحد) أساسية لتوسيع معلومات المستخدم بما يتجاوز ما يوفره Supabase Auth افتراضياً، مثل الأدوار والحالة.
*   **`sales` و `clients`:** علاقة واحد لكثير (العميل الواحد يمكن أن يكون لديه فواتير بيع متعددة). `client_id` في `sales` هو مفتاح أجنبي يشير إلى `clients`.
*   **`sales` و `sale_items`:** علاقة واحد لكثير (فاتورة البيع الواحدة يمكن أن تحتوي على عدة بنود). `sale_id` في `sale_items` هو مفتاح أجنبي.
*   **`sale_items` و `products`:** علاقة كثير لواحد (عدة بنود بيع يمكن أن تشير إلى نفس المنتج). `product_id` في `sale_items` هو مفتاح أجنبي.
*   **`sales` و `partners`:** علاقة واحد لكثير (الشريك الواحد يمكن أن يكون مرتبطاً بعدة فواتير بيع). `partner_id` في `sales` هو مفتاح أجنبي يشير إلى `partners`.
*   **`purchase_invoices` و `suppliers`:** علاقة واحد لكثير (المورد الواحد يمكن أن يكون لديه عدة فواتير شراء). `supplier_id` في `purchase_invoices` هو مفتاح أجنبي.
*   **`purchase_invoices` و `purchase_invoice_items`:** علاقة واحد لكثير.
*   **`purchase_invoice_items` و `products`:** علاقة كثير لواحد.
*   **RLS (Row Level Security):** يجب تطبيق سياسات RLS على جميع الجداول لضمان أمان البيانات وتقييد الوصول بناءً على أدوار المستخدمين.

آمل أن يكون هذا التقرير مفيداً وشاملاً!

