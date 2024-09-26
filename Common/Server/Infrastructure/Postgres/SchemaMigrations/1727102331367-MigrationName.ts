import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationName1727102331367 implements MigrationInterface {
  public name = "MigrationName1727102331367";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "StatusPage" DROP CONSTRAINT "FK_61944d851b4a7213d79ef281744"`,
    );
    await queryRunner.query(
      `ALTER TABLE "StatusPage" ADD CONSTRAINT "FK_61944d851b4a7213d79ef281744" FOREIGN KEY ("smtpConfigId") REFERENCES "ProjectSMTPConfig"("_id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "StatusPage" DROP CONSTRAINT "FK_61944d851b4a7213d79ef281744"`,
    );
    await queryRunner.query(
      `ALTER TABLE "StatusPage" ADD CONSTRAINT "FK_61944d851b4a7213d79ef281744" FOREIGN KEY ("smtpConfigId") REFERENCES "ProjectSMTPConfig"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}