"""Confere o contrato de #25 e a conferência observacional de #28, sem executar testes HTTP."""

import collections
import csv
import json
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "metricas"))
from calcular import OUT_JSON, OUT_MD, build, render
COLUMNS = (
    "id caso_pai regra_id status_definicao precondicoes ator token_estado "
    "recurso_estado metodo endpoint payload http_esperado dados_esperados "
    "efeitos_esperados controle_positivo fonte_politica asvs bloqueio"
).split()
PENDING = {"P06", "P07", "P08", "P09", "P10", "P11"}
FIXTURES = set((
    "U1 U2 ADM1 A B C1 C2 S1 S2 Q1 Q2 CP CD CA CB SA SB CertA CertB "
    "Img1 Img2 Vid1 Vid2 MP MI MNP I1 I2 X codigoA codigoX NOVO"
).split())


def require(condition, message):
    if not condition:
        raise ValueError(message)


def main():
    ledger = (ROOT / "planejamento/escopo-e-decisoes.md").read_text(encoding="utf-8")
    section = (ROOT / "fontes/05-metricas-educado.md").read_text(encoding="utf-8")
    sources = set(re.findall(r"^\| ((?:S|D|N)\d{2}) \|", ledger, re.M))
    rules = set(re.findall(r"^\| (P\d{2}) \|", ledger, re.M))
    with (ROOT / "planejamento/casos-autorizacao.csv").open(
        encoding="utf-8", newline=""
    ) as stream:
        reader = csv.DictReader(stream)
        require(reader.fieldnames == COLUMNS, "Cabeçalho CSV diferente do contrato")
        rows = list(reader)

    ids = {row["id"] for row in rows}
    require(len(ids) == len(rows), "ID de subcaso duplicado")
    parents = {f"AT-{number:02}" for number in range(1, 24)}
    require({row["caso_pai"] for row in rows} == parents, "Faltam casos originais")
    by_id = {row["id"]: row for row in rows}
    for row in rows:
        case = row["id"]
        require(None not in row and len(row) == 18, f"{case}: número de colunas")
        require(all(row.values()), f"{case}: campo vazio")
        require(re.fullmatch(row["caso_pai"] + r"-[PNC]\d+", case), f"{case}: ID")
        case_rules = set(row["regra_id"].split(";"))
        require(case_rules <= rules, f"{case}: regra sem registro")
        require(set(row["fonte_politica"].split(";")) <= sources, f"{case}: fonte")
        require(row["controle_positivo"] in ids, f"{case}: controle ausente")
        control = by_id[row["controle_positivo"]]
        require("-N" not in control["id"], f"{case}: controle negativo como positivo")
        blocked = bool(case_rules & PENDING)
        require(
            row["status_definicao"] == ("bloqueado" if blocked else "definido"),
            f"{case}: estado não corresponde às políticas pendentes",
        )
        require((row["bloqueio"] != "-") == blocked, f"{case}: bloqueio sem motivo")
        # P13 define apenas a ausência; o controle de recurso existente pode
        # aguardar política sem tornar o contrato 404 indefinido.
        absence_contract = case_rules == {"P13"}
        if "P13" in case_rules:
            require(
                absence_contract
                and row["metodo"] == "GET"
                and row["http_esperado"] == "404"
                and "inexistente" in row["recurso_estado"],
                f"{case}: P13 deve tratar somente inexistência com GET/404",
            )
        if absence_contract and control["status_definicao"] == "bloqueado":
            require(
                control["id"] in row["precondicoes"]
                and "execução exige controle" in row["precondicoes"],
                f"{case}: controle pendente exige pré-requisito operacional explícito",
            )
        if not blocked:
            require(
                control["status_definicao"] == "definido" or absence_contract,
                f"{case}: controle bloqueado",
            )
            require("PENDENTE" not in row["http_esperado"], f"{case}: HTTP indefinido")
            require("PENDENTE" not in row["endpoint"], f"{case}: endpoint indefinido")
        require(row["metodo"] in {"GET", "POST", "PUT", "PATCH", "DELETE"}, f"{case}: método")
        tokens = set(re.findall(r"\{([A-Za-z0-9_]+)\}", row["endpoint"] + row["payload"]))
        require(tokens <= FIXTURES, f"{case}: fixture desconhecida {tokens - FIXTURES}")
        if row["payload"] != "-":
            require(isinstance(json.loads(row["payload"]), dict), f"{case}: payload JSON")
        require(
            all(re.fullmatch(r"8\.[1-4]\.\d+", item) for item in row["asvs"].split(";")),
            f"{case}: identificador ASVS",
        )

    counts = collections.Counter(row["status_definicao"] for row in rows)
    summary = f"{len(rows)} subcasos: {counts['definido']} definidos e {counts['bloqueado']} bloqueados"
    require(summary in section, "Totalização da seção 6 diverge do CSV")
    for parent in sorted(parents):
        children = [row for row in rows if row["caso_pai"] == parent]
        blocked = sum(row["status_definicao"] == "bloqueado" for row in children)
        pattern = rf"^\| {parent} \| .* \| {len(children)} \| {blocked} \|$"
        require(re.search(pattern, section, re.M), f"{parent}: total da tabela diverge")

    bibliography = "\n".join(
        path.read_text(encoding="utf-8") for path in (ROOT / "bibliografia").glob("*.bib")
    )
    keys = set(re.findall(r"^@\w+\{([^,]+),", bibliography, re.M))
    require(set(re.findall(r"@([\w-]+)", section)) <= keys, "Citação sem chave BibTeX")

    observed = build()
    require(
        json.loads(OUT_JSON.read_text(encoding="utf-8")) == observed,
        "metricas-obsv.json desatualizado; execute metricas/calcular.py",
    )
    require(
        OUT_MD.read_text(encoding="utf-8") == render(observed),
        "05-resultados-metricas.md desatualizado; execute metricas/calcular.py",
    )
    counts = observed["contagens"]
    print("CSV UTF-8 válido: 18 colunas; 23 casos originais; IDs e controles consistentes")
    print(summary)
    pending_controls = sum(
        row["status_definicao"] == "definido"
        and by_id[row["controle_positivo"]]["status_definicao"] == "bloqueado"
        for row in rows
    )
    print(f"{pending_controls} contratos de inexistência definidos com controle operacional pendente")
    print("Payloads, fixtures, regras, fontes, totalizações e citações conferidos")
    print(
        "Registro de execução conferido: "
        f"{counts['testes_descobertos']} testes, {counts['testes_aprovados']} aprovados, "
        f"{counts['testes_reprovados']} reprovados e {counts['testes_ignorados']} ignorados"
    )
    print("Artefatos de métricas conferidos com catálogo, ledger e relatório de #27")
    print("Validação documental e observacional concluída sem executar testes HTTP")


if __name__ == "__main__":
    main()
