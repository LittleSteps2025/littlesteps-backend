class ChildModel {
    constructor(db) {
        this.db = db; // db should be a database connection or ORM instance
    }

    async findAll() {
        return this.db('children').select('*');
    }

    async findById(id) {
        return this.db('children').where({ child_id: id }).first();
    }

    async create(childData) {
        const [child] = await this.db('children').insert(childData).returning('*');
        return child;
    }

    async update(id, childData) {
        const [child] = await this.db('children')
            .where({ child_id: id })
            .update(childData)
            .returning('*');
        return child;
    }

    async remove(id) {
        const deleted = await this.db('children').where({ child_id: id }).del();
        return deleted > 0;
    }
}

export default ChildModel;