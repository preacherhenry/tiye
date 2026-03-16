import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { uploadFile } from '../utils/storage';

/**
 * POSTER MANAGEMENT
 */

// Get all posters (P1-P2, A1-A6)
export const getPosters = async (req: Request, res: Response) => {
    try {
        const postersSnapshot = await db.collection('posters').get();
        const posters = postersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, posters });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a specific poster slot
export const updatePoster = async (req: Request, res: Response) => {
    try {
        const { slotId } = req.params; // e.g., P1, A1
        const { store_id, status } = req.body;
        let image_url = req.body.image_url;

        if (req.file) {
            image_url = await uploadFile(req.file as Express.Multer.File, 'posters', req);
        }

        const posterData: any = {
            updated_at: new Date().toISOString()
        };

        if (image_url) posterData.image_url = image_url;
        if (store_id) posterData.store_id = store_id;
        if (status) posterData.status = status;

        await db.collection('posters').doc(slotId).set(posterData, { merge: true });

        res.json({ 
            success: true, 
            message: `Poster ${slotId} updated successfully`,
            poster: { id: slotId, ...posterData }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * STORE MANAGEMENT
 */

export const getStores = async (req: Request, res: Response) => {
    try {
        const storesSnapshot = await db.collection('stores').get();
        const stores = storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, stores });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createStore = async (req: Request, res: Response) => {
    try {
        const { store_name, store_description } = req.body;
        let store_logo = '';

        if (req.file) {
            store_logo = await uploadFile(req.file as Express.Multer.File, 'stores', req);
        }

        const newStore = {
            store_name,
            store_description,
            store_logo,
            created_at: new Date().toISOString()
        };

        const docRef = await db.collection('stores').add(newStore);
        res.json({ success: true, storeId: docRef.id, store: { id: docRef.id, ...newStore } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStore = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { store_name, store_description } = req.body;
        let store_logo = req.body.store_logo;

        if (req.file) {
            store_logo = await uploadFile(req.file as Express.Multer.File, 'stores', req);
        }

        const updateData: any = { updated_at: new Date().toISOString() };
        if (store_name) updateData.store_name = store_name;
        if (store_description) updateData.store_description = store_description;
        if (store_logo) updateData.store_logo = store_logo;

        await db.collection('stores').doc(id).update(updateData);
        res.json({ success: true, message: 'Store updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * ITEM MANAGEMENT
 */

export const getItems = async (req: Request, res: Response) => {
    try {
        const { store_id } = req.query;
        let query: any = db.collection('store_items');
        
        if (store_id) {
            query = query.where('store_id', '==', store_id);
        }

        const itemsSnapshot = await query.get();
        const items = itemsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, items });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createItem = async (req: Request, res: Response) => {
    try {
        const { store_id, item_name, description, price, stock_quantity, status } = req.body;
        let image_url = '';

        if (req.file) {
            image_url = await uploadFile(req.file as Express.Multer.File, 'items', req);
        }

        const newItem = {
            store_id,
            item_name,
            description,
            price: Number(price),
            stock_quantity: Number(stock_quantity),
            status: status || 'active',
            image_url,
            created_at: new Date().toISOString()
        };

        const docRef = await db.collection('store_items').add(newItem);
        res.json({ success: true, itemId: docRef.id, item: { id: docRef.id, ...newItem } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { item_name, description, price, stock_quantity, status } = req.body;
        let image_url = req.body.image_url;

        if (req.file) {
            image_url = await uploadFile(req.file as Express.Multer.File, 'items', req);
        }

        const updateData: any = { updated_at: new Date().toISOString() };
        if (item_name) updateData.item_name = item_name;
        if (description) updateData.description = description;
        if (price) updateData.price = Number(price);
        if (stock_quantity) updateData.stock_quantity = Number(stock_quantity);
        if (status) updateData.status = status;
        if (image_url) updateData.image_url = image_url;

        await db.collection('store_items').doc(id).update(updateData);
        res.json({ success: true, message: 'Item updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.collection('store_items').doc(id).delete();
        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
